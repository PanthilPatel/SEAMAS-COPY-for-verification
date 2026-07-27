from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
import os
import sys

backend_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
load_dotenv(os.path.join(backend_root, ".env"))

sys.path.append(os.path.dirname(backend_root))

from schemas.request_models import ChatRequest
from graph.graph import seamas_graph
from agents.orchestrator import run_orchestrator_pipeline
from utils.supabase_client import supabase
import json

app = FastAPI(title="SEAMAS Multi-Agent Backend", version="1.0.0")

allowed_origins = [
    "http://localhost:3000",
    "http://localhost:5173",
    "http://127.0.0.1:3000",
    "http://127.0.0.1:5173"
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_origin_regex=r"https?://.*",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
 

import json
from fastapi.responses import StreamingResponse

NODE_TO_FRONTEND_ID = {
    "search_agent": "search",
    "budget_advisor_agent": "budget",
    "price_comparison_agent": "price",
    "review_analyzer_agent": "reviews",
    "recommendation_agent": "recommendation",
    "finalizer_agent": "finalizer"
}

@app.post("/api/chat")
async def chat_endpoint(payload: ChatRequest):
    try:
        # Check cache disabled to ensure fresh search results on identical queries
        # if supabase:
        #     try:
        #         res = supabase.table("cached_results").select("result_payload").eq("query", payload.query.lower().strip()).execute()
        #         if res.data and len(res.data) > 0:
        #             cached = res.data[0]["result_payload"]
        #             cached.setdefault("logs", []).append(f"Cache Hit: Loaded instantly from Supabase.")
        #             return cached
        #     except Exception as ce:
        #         print(f"[Supabase Cache Error] {ce}")

        initial_state = {
            "query": payload.query,
            "search_results": [],
            "price_data": [],
            "analysis_report": {},
            "recommendations": [],
            "budget_status": {}, 
            "logs": [f"Session routing initialized via main API endpoint for context: '{payload.query}'."]
        }
        
        agent_mode = os.getenv("AGENT_MODE", "graph").strip().lower()
        
        if agent_mode == "orchestrator":
            response_state = await run_orchestrator_pipeline(initial_state)
        else:
            response_state = await seamas_graph.ainvoke(initial_state)
            
        # Write to cache
        if supabase:
            try:
                supabase.table("cached_results").upsert({
                    "query": payload.query.lower().strip(),
                    "result_payload": response_state
                }).execute()
            except Exception as ce:
                print(f"[Supabase Cache Write Error] {ce}")
                
        return response_state
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/chat/stream")
async def chat_stream_endpoint(payload: ChatRequest):
    async def event_generator():
        query_key = payload.query.lower().strip()
        # Check cache first disabled to ensure fresh search results on identical queries
        # if supabase:
        #     try:
        #         res = supabase.table("cached_results").select("result_payload").eq("query", query_key).execute()
        #         if res.data and len(res.data) > 0:
        #             cached = res.data[0]["result_payload"]
        #             cached.setdefault("logs", []).append(f"Cache Hit: Loaded instantly from Supabase.")
        #             # Simulate all agent nodes immediately completing
        #             for agent_id in ["search", "price", "reviews", "budget", "recommendation", "finalizer"]:
        #                 yield f"data: {json.dumps({'type': 'node_start', 'agent_id': agent_id})}\n\n"
        #                 yield f"data: {json.dumps({'type': 'node_complete', 'agent_id': agent_id})}\n\n"
        #             
        #             yield f"data: {json.dumps({'type': 'result', 'payload': cached})}\n\n"
        #             return
        #     except Exception as ce:
        #         print(f"[Supabase Cache Stream Error] {ce}")

        initial_state = {
            "query": payload.query,
            "search_results": [],
            "price_data": [],
            "analysis_report": {},
            "recommendations": [],
            "budget_status": {}, 
            "logs": [f"Session routing initialized via main API endpoint for context: '{payload.query}'."]
        }
        
        yield f"data: {json.dumps({'type': 'node_start', 'agent_id': 'search'})}\n\n"
        
        final_state = dict(initial_state)
        
        try:
            async for event in seamas_graph.astream(initial_state):
                for node_name, state_update in event.items():
                    if isinstance(state_update, dict):
                        final_state.update(state_update)
                    
                    agent_id = NODE_TO_FRONTEND_ID.get(node_name, node_name)
                    yield f"data: {json.dumps({'type': 'node_complete', 'agent_id': agent_id})}\n\n"
                    
                    if agent_id == "search":
                        yield f"data: {json.dumps({'type': 'node_start', 'agent_id': 'price'})}\n\n"
                        yield f"data: {json.dumps({'type': 'node_start', 'agent_id': 'reviews'})}\n\n"
                        yield f"data: {json.dumps({'type': 'node_start', 'agent_id': 'budget'})}\n\n"
                    elif agent_id in ("price", "reviews", "budget"):
                        yield f"data: {json.dumps({'type': 'node_start', 'agent_id': 'recommendation'})}\n\n"
                    elif agent_id == "recommendation":
                        yield f"data: {json.dumps({'type': 'node_start', 'agent_id': 'finalizer'})}\n\n"

            # Cache the result for future identical searches
            if supabase:
                try:
                    # Supabase cannot serialize sets directly, but our state shouldn't have sets.
                    # json.loads(json.dumps()) ensures it's JSON serializable.
                    supabase.table("cached_results").upsert({
                        "query": query_key,
                        "result_payload": json.loads(json.dumps(final_state, default=str))
                    }).execute()
                except Exception as ce:
                    print(f"[Supabase Cache Write Error] {ce}")

            yield f"data: {json.dumps({'type': 'result', 'payload': final_state})}\n\n"
        except Exception as err:
            yield f"data: {json.dumps({'type': 'error', 'message': str(err)})}\n\n"

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no"
        }
    )