from pydantic import BaseModel, Field, field_validator
from typing import Optional

class ChatRequest(BaseModel):
    query: str = Field(..., min_length=2, max_length=300, description="The client intent search string")
    max_price: Optional[int] = Field(None, description="Optional upper boundary price target limit")

    @field_validator("query")
    @classmethod
    def strip_and_validate_query(cls, v: str) -> str:
        cleaned = v.strip()
        if not cleaned:
            raise ValueError("Query string cannot be empty or purely composed of whitespaces.")
        return cleaned