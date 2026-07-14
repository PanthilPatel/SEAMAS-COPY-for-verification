import json
from typing import Dict, Any, List
from ollama import AsyncClient
from pydantic import BaseModel, Field


class AnalysisReport(BaseModel):
    sentiment_summary: str = Field(description="One or two sentence overall sentiment summary.")
    pros: List[str] = Field(description="Up to 3 pros grounded in the source text.")
    cons: List[str] = Field(description="Up to 2 cons grounded in the source text.")


async def review_analyzer_agent(state: Dict[str, Any]) -> Dict[str, Any]:
    search_results = state.get("search_results", [])
    query = state.get("query", "")

    print("--- OLLAMA REVIEW ANALYZER AGENT INITIATED ---")

    if not search_results:
        return {
            "analysis_report": {"sentiment_summary": "No web text data available.", "pros": [], "cons": []},
            "logs": ["No web records available for sentiment extraction."]
        }

    context = "\n\n".join(
        f"Title: {r.get('title', '')}\nContent: {(r.get('content') or '')[:400]}"
        for r in search_results
    )

    prompt = f"""You are an expert consumer sentiment analyzer.

Query: "{query}"

Analyze the raw web text below and summarize buyer sentiment.
Give a one-to-two sentence sentiment summary, up to 3 pros, and up to 2 cons —
all grounded directly in the text, don't invent anything not implied by it.

Raw Search Context:
{context}
"""

    try:
        response = await AsyncClient().chat(
            model="qwen2.5:latest",
            messages=[{"role": "user", "content": prompt}],
            format=AnalysisReport.model_json_schema(),
            options={"temperature": 0.2, "num_ctx": 8192, "num_predict": 2048},
        )

        parsed = json.loads(response["message"]["content"])
        print("Successfully extracted sentiment report.")
        return {
            "analysis_report": parsed,
            "logs": ["Successfully executed Review Analyzer."]
        }

    except Exception as e:
        print(f"Sentiment analysis failed: {e}")
        return {
            "analysis_report": {"sentiment_summary": "Failed to analyze sentiments.", "pros": [], "cons": []},
            "logs": [f"Review analyzer failed: {str(e)}"]
        }