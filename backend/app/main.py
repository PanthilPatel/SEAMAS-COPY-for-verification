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
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.post("/api/chat")
async def chat_endpoint(payload: ChatRequest):
    try:
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
            
        return response_state
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))