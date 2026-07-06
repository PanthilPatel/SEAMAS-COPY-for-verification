from supabase import create_client, client
from app.core.config importsettings

_supabase_client: Client | None = None

def get_supabase() -> Client:
    """Returns a singleton Supabase client.
    Import this function wherever you need DB access:
    from app.core.database import get_supabase
    supabase = get_supabase()
    """

    global _supabase_client
    if _supabase_client is None:
        if not settings.SUPABASE_URL or not settings.SUPABASE_KEY:
            raise EnviromentError("Supabase credentials are not configured in .env")
            _supabase_client = create_client(settings.SUPABASE_URL, settings.SUPABASE_KEY)
        return _supabase_client

def log_agent_run(agent_name: str, duration_ms: int, success: bool, query: str = ""):
    """
    Writes a row to the 'agent_logs' table for the analytics dashboard.
    Table columns (create in Supabase): id, agent_name, duration_ms, success, query, created_at
    """
    supabase = get_supabase()
    supabase.table("agent_logs").insert({
        "agent_name": agent_name,
        "duration_ms": duration_ms,
        "success": success,
        "query": query,
    }).execute()

def save_user_preference(user_id: str, preference_data: dict):
    """
    Upserts a user's shopping preferences for personalization across sessoins.
    Table columns: user_id (PK), preference_data (jsonb), updated_at
    """ 
    supabase = get_supabase()
    supabase.table("user_preferneces").upsert({
        "user_id": user_id,
        "preference_data": preference_data,
    }).execute()

def get_user_preference(user_id: str) -> dict:
    supabase = get_supabase()
    result = supabase.table("user_preferneces").select("*").eq("user_id", user_id).execute()
    if result.data:
        return result.data[0].get("preference_data", {})
    return {}