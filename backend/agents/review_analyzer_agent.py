import json
from typing import Dict, Any, List
from ollama import AsyncClient
from pydantic import BaseModel, Field

class AnalysisReport(BaseModel):
    sentiment_summary: str = Field(description="One impactful sentence summarizing market consensus.")
    pros: List[str] = Field(description="Array of up to 3 text-grounded advantages.")
    cons: List[str] = Field(description="Array of up to 2 product limitations.")

async def review_analyzer_agent(state: Dict[str, Any]) -> Dict[str, Any]:
    search_results = state.get("search_results", [])
    query = state.get("query", "")
    
    print(f"\n OLLAMA REVIEW ANALYZER AGENT INITIATED ---")
    if not search_results:
        default_fail = {"sentiment_summary": "No data", "pros": [], "cons": []}
        return {"analysis_report": default_fail, "logs": ["Skipped analysis."]}
        
    context_data = "\n".join([f"Text: {item.get('content')}" for item in search_results])
    prompt = f"Perform a consensus sentiment evaluation for '{query}' based on these user reviews:\n{context_data}"
    
    try:
        response = await AsyncClient().chat(
            model='llama3.1',
            messages=[{'role': 'user', 'content': prompt}],
            format=AnalysisReport.model_json_schema(),
            options={'temperature': 0.2}
        )
        
        raw_content = response['message']['content']
        report_data = json.loads(raw_content)
        
        print(f"Local sentiment processing locked down.")
        return {
            "analysis_report": report_data,
            "logs": ["Executed Review Analyzer via local Ollama pipeline."]
        }
    except Exception as e:
        print(f"Ollama Analytics Error: {e}")
        fallback = {"sentiment_summary": "Failed to parse locally", "pros": [], "cons": []}
        return {"analysis_report": fallback, "logs": [str(e)]}