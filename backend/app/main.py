"""SEAMAS FastAPI application."""
import asyncio
import json
import logging
import os
import sys
from contextlib import asynccontextmanager
from uuid import uuid4

import httpx
import razorpay
from dotenv import load_dotenv
from fastapi import Depends, FastAPI, Header, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, ConfigDict, Field

backend_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
load_dotenv(os.path.join(backend_root, ".env"))
sys.path.append(os.path.dirname(backend_root))

from agents.orchestrator import stream_orchestrator_pipeline
from core.config import settings, validate_production_config
from graph.graph import seamas_graph
from schemas.request_models import ChatRequest
from utils.credits_db import CreditServiceUnavailable, deduct_credit, get_credits
from utils.rate_limiter import RateLimitUnavailable, check_rate_limit
from utils.supabase_client import supabase

logger = logging.getLogger("seamas.api")


@asynccontextmanager
async def lifespan(_: FastAPI):
    validate_production_config()
    yield


app = FastAPI(title="SEAMAS Multi-Agent Backend", version="1.0.0", lifespan=lifespan)
allowed_origins = [origin.strip() for origin in settings.ALLOWED_ORIGINS.split(",") if origin.strip()]
if not allowed_origins and settings.ENVIRONMENT.lower() != "production":
    allowed_origins = ["http://localhost:5173", "http://127.0.0.1:5173"]
app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type", "X-Request-ID"],
)


@app.middleware("http")
async def request_context(request: Request, call_next):
    request_id = request.headers.get("x-request-id") or str(uuid4())
    request.state.request_id = request_id
    try:
        response = await call_next(request)
    except Exception:
        logger.exception("Unhandled request error id=%s path=%s", request_id, request.url.path)
        response = HTTPException(status_code=500, detail="The request could not be completed.")
        from starlette.responses import JSONResponse
        response = JSONResponse(status_code=500, content={"detail": response.detail})
    response.headers["X-Request-ID"] = request_id
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    return response


async def enforce_rate_limit(scope: str, identity: str, limit: int, window_seconds: int) -> None:
    try:
        allowed, retry_after = await check_rate_limit(scope, identity, limit, window_seconds)
    except RateLimitUnavailable:
        logger.exception("Shared rate limiter unavailable scope=%s", scope)
        raise HTTPException(status_code=503, detail="Request protection is temporarily unavailable.")
    if not allowed:
        raise HTTPException(status_code=429, detail="Too many requests. Please try again shortly.",
                            headers={"Retry-After": str(max(1, retry_after))})


async def current_user(request: Request, authorization: str | None = Header(default=None)) -> dict:
    """Validate the bearer token with Supabase Auth; never accept an ID from JSON."""
    ip = request.client.host if request.client else "unknown"
    await enforce_rate_limit("auth-ip", ip, 60, 60)
    if not authorization or not authorization.lower().startswith("bearer "):
        raise HTTPException(status_code=401, detail="Sign in to continue.")
    if not settings.SUPABASE_URL or not settings.SUPABASE_ANON_KEY:
        raise HTTPException(status_code=503, detail="Authentication service is not configured.")
    token = authorization.split(" ", 1)[1].strip()
    if not token:
        raise HTTPException(status_code=401, detail="Invalid authentication token.")
    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            response = await client.get(
                f"{settings.SUPABASE_URL.rstrip('/')}/auth/v1/user",
                headers={"apikey": settings.SUPABASE_ANON_KEY, "Authorization": f"Bearer {token}"},
            )
        if response.status_code != 200:
            raise HTTPException(status_code=401, detail="Invalid or expired authentication token.")
        user = response.json()
        if not user.get("id"):
            raise HTTPException(status_code=401, detail="Invalid authentication token.")
        await enforce_rate_limit("user-api", str(user["id"]), 300, 60)
        return user
    except HTTPException:
        raise
    except httpx.HTTPError:
        logger.exception("Supabase auth request failed")
        raise HTTPException(status_code=503, detail="Authentication service is temporarily unavailable.")


def create_initial_state(payload: ChatRequest) -> dict:
    return {
        "query": payload.query,
        "category": "general",
        "budget": payload.max_price,
        "budget_type": "hard_limit" if payload.max_price is not None else "none",
        "user_preferences": {}, "search_results": [], "price_data": [],
        "analysis_report": {}, "recommendations": [], "budget_status": {},
        "steering_mode": payload.steering_mode or "balanced",
        "logs": ["Session routing initialized via API."],
    }


def search_cost(mode: str) -> int:
    return {"speed": 5, "balanced": 10, "accuracy": 20}[mode]


def charge_search_credits(user: dict, amount: int) -> None:
    """Charge the authenticated identity atomically and keep failures distinct."""
    user_id = str(user["id"])
    try:
        charged = deduct_credit(user_id, amount)
    except CreditServiceUnavailable:
        logger.exception("Credit deduction service unavailable user_ref=%s", user_id[:8])
        raise HTTPException(status_code=503, detail={
            "code": "credits_unavailable",
            "message": "Credits could not be verified. Please try again.",
            "required_credits": amount,
            "user_ref": user_id[:8],
        })
    if charged:
        return
    try:
        available = get_credits(user_id)["credits"]
    except CreditServiceUnavailable:
        logger.exception("Credit balance lookup failed after declined deduction user_ref=%s", user_id[:8])
        raise HTTPException(status_code=503, detail={
            "code": "credits_unavailable",
            "message": "Credits could not be verified. Please try again.",
            "required_credits": amount,
            "user_ref": user_id[:8],
        })
    if available >= amount:
        logger.error(
            "Credit RPC declined a sufficient balance user_ref=%s available=%s required=%s",
            user_id[:8], available, amount,
        )
        raise HTTPException(status_code=503, detail={
            "code": "credits_inconsistent",
            "message": "The credit service could not reconcile your balance. No search was started; please retry.",
            "available_credits": available,
            "required_credits": amount,
            "user_ref": user_id[:8],
        })
    raise HTTPException(status_code=402, detail={
        "code": "insufficient_credits",
        "message": "Insufficient search credits. Please upgrade your plan.",
        "available_credits": available,
        "required_credits": amount,
        "user_ref": user_id[:8],
    })


@app.post("/api/chat")
async def chat_endpoint(payload: ChatRequest, user: dict = Depends(current_user)):
    await enforce_rate_limit("chat", str(user["id"]), 10, 60)
    cost = search_cost(payload.steering_mode or "balanced")
    charge_search_credits(user, cost)
    try:
        state = await seamas_graph.ainvoke(create_initial_state(payload))
        if supabase:
            try:
                supabase.table("cached_results").upsert({
                    "query": payload.query.lower().strip(), "result_payload": state,
                }).execute()
            except Exception:
                logger.exception("Cache write failed")
        return state
    except Exception:
        logger.exception("Chat pipeline failed request_id=%s", getattr(user, "request_id", "unknown"))
        raise HTTPException(status_code=502, detail="Product search failed. Please try again.")


@app.post("/api/chat/stream")
async def chat_stream_endpoint(payload: ChatRequest, request: Request, user: dict = Depends(current_user)):
    await enforce_rate_limit("chat-stream", str(user["id"]), 10, 60)
    charge_search_credits(user, search_cost(payload.steering_mode or "balanced"))

    async def event_generator():
        try:
            async for event in stream_orchestrator_pipeline(create_initial_state(payload)):
                if await request.is_disconnected():
                    break
                yield f"data: {json.dumps(event, default=str)}\n\n"
                if event.get("type") == "result" and supabase:
                    try:
                        supabase.table("cached_results").upsert({
                            "query": payload.query.lower().strip(),
                            "result_payload": event.get("payload", {}),
                        }).execute()
                    except Exception:
                        logger.exception("Stream cache write failed")
        except asyncio.CancelledError:
            raise
        except Exception:
            logger.exception("Stream pipeline failed")
            yield f"data: {json.dumps({'type': 'error', 'message': 'Product search failed. Please try again.'})}\n\n"

    return StreamingResponse(event_generator(), media_type="text/event-stream", headers={
        "Cache-Control": "no-cache, no-transform", "X-Accel-Buffering": "no",
    })


@app.get("/health")
async def health():
    return {"status": "ok"}


@app.get("/ready")
async def ready():
    if not supabase:
        raise HTTPException(status_code=503, detail="Database is not configured.")
    try:
        result = supabase.rpc("seamas_schema_is_ready", {}).execute()
        if result.data is not True:
            raise RuntimeError("Schema capability check returned false")
    except Exception:
        raise HTTPException(status_code=503, detail="Database schema is not ready. Apply the required migration.")
    return {"status": "ready"}


@app.get("/api/status")
async def status_endpoint(request: Request):
    await enforce_rate_limit("public-status", request.client.host if request.client else "unknown", 60, 60)
    from core.config import resolve_ollama_model
    active_model = resolve_ollama_model()
    return {
        "api": "operational",
        "database": "configured" if supabase else "unavailable",
        "ollama": {
            "status": "connected" if active_model else "offline",
            "model": active_model,
        }
    }


@app.get("/api/credits/me")
async def fetch_my_credits(user: dict = Depends(current_user)):
    await enforce_rate_limit("credits", str(user["id"]), 60, 60)
    try:
        return get_credits(user["id"])
    except CreditServiceUnavailable:
        logger.exception("Credit balance service unavailable user_ref=%s", str(user["id"])[:8])
        raise HTTPException(status_code=503, detail="Credits could not be loaded. Please try again.")


TOPUP_PACKS = {
    "booster_100": {"credits": 100, "amount": 100, "name": "Booster Mini (+100 Credits)"},
    "booster_250": {"credits": 250, "amount": 200, "name": "Booster Pro (+250 Credits)"},
    "booster_500": {"credits": 500, "amount": 300, "name": "Booster Ultra (+500 Credits)"},
}
PLANS = {"pro_monthly": {"credits": 500, "amount": 100, "name": "SEAMAS Pro Monthly Subscription"}}


def get_razorpay_client():
    if not settings.RAZORPAY_KEY_ID or not settings.RAZORPAY_KEY_SECRET:
        raise HTTPException(status_code=503, detail="Payment service is not configured.")
    return razorpay.Client(auth=(settings.RAZORPAY_KEY_ID, settings.RAZORPAY_KEY_SECRET))


class CreateOrderRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")
    plan_type: str = Field(default="pro_monthly", pattern="^(pro_monthly|topup)$")
    pack_id: str | None = Field(default=None, max_length=40)


class PaymentVerification(BaseModel):
    model_config = ConfigDict(extra="ignore")
    razorpay_payment_link_id: str = Field(min_length=5, max_length=100)
    razorpay_payment_id: str = Field(min_length=5, max_length=100)
    razorpay_signature: str = Field(min_length=16, max_length=256)
    razorpay_payment_link_reference_id: str | None = Field(default=None, max_length=100)
    razorpay_payment_link_status: str | None = Field(default=None, max_length=40)


@app.post("/api/create-order")
async def create_order(payload: CreateOrderRequest, user: dict = Depends(current_user)):
    await enforce_rate_limit("create-order", str(user["id"]), 5, 600)
    plan = TOPUP_PACKS.get(payload.pack_id) if payload.plan_type == "topup" else PLANS[payload.plan_type]
    if not plan:
        raise HTTPException(status_code=422, detail="Unknown credit pack.")
    if not supabase:
        raise HTTPException(status_code=503, detail="Payment records are not configured.")
    transaction_id = str(uuid4())
    try:
        # Persist the server-owned payment entitlement before contacting Razorpay.
        supabase.table("payment_transactions").insert({
            "id": transaction_id, "user_id": user["id"], "plan_type": payload.plan_type,
            "credits": plan["credits"], "amount": plan["amount"], "currency": "INR", "status": "creating",
        }).execute()
        customer = {"email": user.get("email") or ""}
        payment_link = get_razorpay_client().payment_link.create({
            "amount": plan["amount"], "currency": "INR", "accept_partial": False,
            "description": plan["name"], "customer": customer,
            "notify": {"sms": False, "email": False}, "reminder_enable": False,
            "callback_url": f"{settings.FRONTEND_BASE_URL.rstrip('/')}/dashboard?payment=success&type={payload.plan_type}",
            "callback_method": "get", "reference_id": transaction_id,
        })
        supabase.table("payment_transactions").update({
            "razorpay_payment_link_id": payment_link["id"], "status": "pending",
        }).eq("id", transaction_id).execute()
        return {"payment_link_id": payment_link["id"], "short_url": payment_link["short_url"]}
    except HTTPException:
        raise
    except Exception:
        logger.exception("Payment link creation failed transaction_id=%s", transaction_id)
        raise HTTPException(status_code=502, detail="Payment initialization failed. Please try again.")


@app.post("/api/verify-payment")
async def verify_payment(payload: PaymentVerification, user: dict = Depends(current_user)):
    await enforce_rate_limit("verify-payment", str(user["id"]), 20, 60)
    if not supabase:
        raise HTTPException(status_code=503, detail="Payment records are not configured.")
    try:
        rows = supabase.table("payment_transactions").select("*").eq(
            "razorpay_payment_link_id", payload.razorpay_payment_link_id
        ).eq("user_id", user["id"]).limit(1).execute().data
        if not rows:
            raise HTTPException(status_code=404, detail="Payment transaction not found.")
        transaction = rows[0]
        if transaction.get("status") == "completed":
            return {"status": "success", "credits": get_credits(user["id"]), "idempotent": True}
        if transaction.get("status") != "pending":
            raise HTTPException(status_code=409, detail="Payment transaction is not payable.")
        client = get_razorpay_client()
        client.utility.verify_payment_link_signature({
            "payment_link_id": payload.razorpay_payment_link_id,
            "razorpay_payment_id": payload.razorpay_payment_id,
            "payment_link_reference_id": payload.razorpay_payment_link_reference_id or transaction["id"],
            "payment_link_status": payload.razorpay_payment_link_status or "paid",
            "razorpay_signature": payload.razorpay_signature,
        })
        payment = client.payment.fetch(payload.razorpay_payment_id)
        payment_link = client.payment_link.fetch(payload.razorpay_payment_link_id)
        if (payment.get("status") != "captured" or payment.get("amount") != int(transaction["amount"])
                or payment.get("currency") != transaction["currency"]
                or payment.get("payment_link_id") != payload.razorpay_payment_link_id
                or payment_link.get("status") != "paid"
                or payment_link.get("amount") != int(transaction["amount"])
                or payment_link.get("reference_id") != transaction["id"]):
            raise HTTPException(status_code=400, detail="Payment amount or status does not match the transaction.")
        result = supabase.rpc("complete_payment_and_credit", {
            "p_transaction_id": transaction["id"], "p_user_id": user["id"],
            "p_payment_id": payload.razorpay_payment_id,
        }).execute()
        return {"status": "success", "credits": result.data}
    except HTTPException:
        raise
    except razorpay.errors.SignatureVerificationError:
        logger.warning("Payment signature mismatch user_id=%s", user["id"])
        raise HTTPException(status_code=400, detail="Payment signature verification failed.")
    except Exception:
        logger.exception("Payment verification failed user_id=%s", user["id"])
        raise HTTPException(status_code=502, detail="Payment verification could not be processed.")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="127.0.0.1", port=8000, reload=True)
