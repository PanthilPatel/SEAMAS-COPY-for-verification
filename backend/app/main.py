from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
import os

backend_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
load_dotenv(os.path.join(backend_root, ".env"))

from schemas.request_models import ChatRequest
from graph.graph import seamas_graph

app = FastAPI(title="SEAMAS Multi-Agent Backend", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.post("/api/chat")
async def handle_agent_chat(payload: ChatRequest):
    """Inbound chat endpoint executing the full compiled multi-agent state graph pipeline."""
    try:
        initial_state = {
            "query": payload.query,
            "search_results": [],
            "price_data": [],
            "analysis_report": {},
            "recommendations": [],
            "logs": [f"Session initialized via API for client query: '{payload.query}'."]
        }
        
        final_state = await seamas_graph.ainvoke(initial_state)
        return final_state
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Graph Execution Error: {str(e)}")

@app.get("/api/health")
def health_check():
    return {"status": "healthy", "service": "SEAMAS Pipeline Core"}