from supabase import create_client, Client 
from core.config import settings          

_supabase_client = None

def get_supabase() -> Client:
    global _supabase_client
    if _supabase_client is None:
        key = settings.SUPABASE_SERVICE_ROLE_KEY or settings.SUPABASE_ANON_KEY
        if not settings.SUPABASE_URL or not key:
            raise EnvironmentError("Supabase credentials missing from environment settings.")
        _supabase_client = create_client(settings.SUPABASE_URL, key)
    
    return _supabase_client