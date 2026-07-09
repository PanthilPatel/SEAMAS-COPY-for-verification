from pydantic import BaseModel, Field
from typing import Optional

class ChatRequest(BaseModel):
    query: str = Field(..., description = "The product search query or shopping criteria", example = "Laptop under 60000")
    user_id: Optional[str] = Field(None, description="Optional unique identifier for user preferences history tracking")