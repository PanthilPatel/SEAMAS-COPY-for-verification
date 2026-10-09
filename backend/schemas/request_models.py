from pydantic import BaseModel, Field, field_validator
from typing import Optional, Literal

class ChatRequest(BaseModel):
    query: str = Field(..., min_length=2, max_length=300, description="The client intent search string")
    max_price: Optional[int] = Field(None, gt=0, le=100000000, description="Optional upper boundary price target limit")
    user_id: Optional[str] = Field(None, max_length=128, description="Deprecated UI compatibility field; ignored by the API")
    steering_mode: Literal["balanced", "speed", "accuracy"] = Field("balanced", description="AI Steering Mode")
    bypass_cache: bool = Field(False, description="Bypass read-through cache")

    @field_validator("query")
    @classmethod
    def strip_and_validate_query(cls, v: str) -> str:
        cleaned = v.strip()
        if not cleaned:
            raise ValueError("Query string cannot be empty or purely composed of whitespaces.")
        return cleaned
