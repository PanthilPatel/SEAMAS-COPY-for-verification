import os
from typing import Dict, Any, List
from google import genai
from google.genai import types
from pydantic import BaseModel, Field

class AnalysisReport(BaseModel):
    sentiment_summary: str = Field(description="One impactful sentence summarizing the market consensus.")
    pros: List[str] = Field(description="Array of up to 3 specific text-grounded product advantages.")
    cons: List[str] = Field(description="Array of up to 2 specific limitations or segment risks.")

async def review_analyzer_agent(state: Dict[str, Any]) -> Dict[str, Any]:
    """
    Analyzer Agent (Asynchronous & Schema Enforced)
    """
    search_results = state.get("search_results", [])
    query = state.get("query", "")
    
    print(f"\n--- REVIEW ANALYZER AGENT INITIATED ---")
    
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key or not search_results:
        return {"analysis_report": {"sentiment_summary": "No data", "pros": [], "cons": []}, "logs": ["Skipped analysis."]}
        
    client = genai.Client(api_key=api_key)
    context_data = "\n".join([f"Text: {item.get('content')}" for item in search_results])
    
    prompt = f"Analyze market feedback context for '{query}':\n{context_data}"
    
    try:
        response = await client.aio.models.generate_content(
            model='gemini-2.5-flash',
            contents=prompt,
            config=types.GenerateContentConfig(
                response_mime_type="application/json",
                response_schema=AnalysisReport,
                temperature=0.2
            )
        )
        
        report_data = response.parsed.model_dump() if response.parsed else {"sentiment_summary": "No consensus parsed.", "pros": [], "cons": []}
        print(f"Live sentiment metrics locked down.")
        return {
            "analysis_report": report_data,
            "logs": ["Successfully executed Review Analyzer with async schema validation."]
        }
    except Exception as e:
        print(f"Error: {e}")
        return {"analysis_report": {"sentiment_summary": "Failed to parse", "pros": [], "cons": []}, "logs": [str(e)]}