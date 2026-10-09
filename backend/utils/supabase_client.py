import os
from supabase import create_client, Client
from dotenv import load_dotenv

# Ensure environment variables are loaded
load_dotenv()

supabase_url = os.environ.get("SUPABASE_URL")
supabase_key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")

if not supabase_url or not supabase_key:
    print("[WARNING] Supabase URL or service role key is missing. Server-side database operations are disabled.")
    supabase: Client = None
else:
    supabase: Client = create_client(supabase_url, supabase_key)
