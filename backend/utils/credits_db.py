from utils.supabase_client import supabase

def init_db():
    pass

def get_credits(user_id: str) -> dict:
    if not supabase:
        return {'tier': 'free', 'credits': 50}
    try:
        res = supabase.table('profiles').select('tier, credits').eq('id', user_id).execute()
        if res.data and len(res.data) > 0:
            row = res.data[0]
            tier = row.get('tier') or 'free'
            credits = row.get('credits') if row.get('credits') is not None else 50
            return {'tier': tier, 'credits': credits}
        else:
            # Self-healing: if the user profile row does not exist, insert it
            try:
                supabase.table('profiles').insert({'id': user_id, 'tier': 'free', 'credits': 50}).execute()
            except Exception as ie:
                print(f"[Supabase insert error in get_credits] {ie}")
            return {'tier': 'free', 'credits': 50}
    except Exception as e:
        print(f"[Supabase error in get_credits] {e}")
        return {'tier': 'free', 'credits': 50}

def deduct_credit(user_id: str, amount: int = 1) -> bool:
    if not supabase:
        return True
    try:
        res = supabase.table('profiles').select('tier, credits').eq('id', user_id).execute()
        if res.data and len(res.data) > 0:
            row = res.data[0]
            current_credits = row.get('credits') if row.get('credits') is not None else 50
            if current_credits >= amount:
                supabase.table('profiles').update({'credits': current_credits - amount}).eq('id', user_id).execute()
                return True
        else:
            # Self-healing: if the user profile row does not exist, insert and deduct
            credits = 50 - amount
            if credits >= 0:
                try:
                    supabase.table('profiles').insert({'id': user_id, 'tier': 'free', 'credits': credits}).execute()
                    return True
                except Exception as ie:
                    print(f"[Supabase insert error in deduct_credit] {ie}")
        return False
    except Exception as e:
        print(f"[Supabase error in deduct_credit] {e}")
        return False

def upgrade_to_pro(user_id: str):
    if not supabase:
        return
    try:
        # Use upsert to handle case where profile row does not exist yet
        supabase.table('profiles').upsert({'id': user_id, 'tier': 'pro', 'credits': 500}).execute()
    except Exception as e:
        print(f"[Supabase error in upgrade_to_pro] {e}")
