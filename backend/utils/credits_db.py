"""Credit operations delegated to transaction-safe Supabase database RPCs."""
from utils.supabase_client import supabase


class CreditServiceUnavailable(RuntimeError):
    """Credit storage could not be read or updated reliably."""


def get_credits(user_id: str) -> dict:
    if not supabase:
        raise CreditServiceUnavailable("Credit database is not configured")
    try:
        response = supabase.table("profiles").select("tier,credits").eq("id", user_id).single().execute()
        row = response.data
        if not isinstance(row, dict):
            raise ValueError("Profile credit record is missing")
        credits = row.get("credits")
        if isinstance(credits, bool) or not isinstance(credits, int) or credits < 0:
            raise ValueError("Profile credit balance is invalid")
        return {"tier": row.get("tier") or "free", "credits": credits, "renew_at": None}
    except Exception as exc:
        raise CreditServiceUnavailable("Credit balance could not be loaded") from exc


def deduct_credit(user_id: str, amount: int = 1) -> bool:
    if amount <= 0:
        raise ValueError("Credit deduction amount must be positive")
    if not supabase:
        raise CreditServiceUnavailable("Credit database is not configured")
    try:
        result = supabase.rpc("deduct_credits", {"p_user_id": user_id, "p_amount": amount}).execute()
        if not isinstance(result.data, bool):
            raise ValueError("Credit deduction RPC returned an invalid result")
        return result.data
    except Exception as exc:
        # Only an explicit false means insufficient balance. Infrastructure and
        # schema errors must not be reported as an account entitlement problem.
        raise CreditServiceUnavailable("Credit deduction could not be completed") from exc


def refund_credit(user_id: str, amount: int, reference_id: str | None = None) -> int:
    """Refund credits to the user profile exactly once with idempotency reference."""
    if amount <= 0:
        raise ValueError("Credit refund amount must be positive")
    if not supabase:
        raise CreditServiceUnavailable("Credit database is not configured")
    try:
        result = supabase.rpc("refund_credits", {
            "p_user_id": user_id,
            "p_amount": amount,
            "p_reference_id": reference_id,
        }).execute()
        if not isinstance(result.data, int):
            raise ValueError("Credit refund RPC returned an invalid balance")
        return result.data
    except Exception as exc:
        raise CreditServiceUnavailable("Credit refund could not be completed") from exc
