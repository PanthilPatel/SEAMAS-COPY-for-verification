import os
from dotenv import load_dotenv

load_dotenv()

class Settings:
    GEMINI_API_KEY: str = os.getenv("Gemini_API_KEY","")
    GEMINI_PRO_MODEL: str = os.getenv("GEMINI_PRO_MODEL","gemini-3.1-pro")
    GEMINI_FLASH_MODEL: str = os.getenv("GEMINI_FLASH_MODEL","gemini-3.5-flash")

    SUPABASE_URL: str = os.getenv("SUPABASE_URL","")
    SUPABASE_KEY: str = os.getenv("SUPABASE_KEY","")

    TAVILY_API_KEY: str = os.getenv("SEARXNG_BASE_URL","http://localhost:8080")

    ENVIRONMENT: str = os.getenv("ENVIRONMENT","development")

    def validate(self):
        """Call this at startup to fail fast if required keys are missing."""
        missing = []
        if not self.GEMINI_API_KEY:
            missing.append("GEMINI_API_KEY")
        if not self.SUPABASE_URL:
            missing.append("SUPABASE_URL")
        if not self.SUPABASE_KEY:
            missing.append("SUPABASE_KEY")
        if missing:
            raise EnvironmentError(
                f"Missing required environment variables: {', '.join(missing)}."
                f"Check your .env file against .env.example."
            )

settings = settings()