import os
import json
from typing import Dict, Any
from google import genai
from google.genai import types

async def review_analyzer_agent(state: Dict[str, Any]) -> Dict[str, Any]:
    """
    T8: Review Analyzer Agent.
    Evaluates real-time sentiments, pros, and cons from live aggregated web snippets.
    """
    search_results = state.get("search_results", [])
    query = state.get("query", "")
    
    print(f"\n--- REVIEW ANALYZER AGENT INITIATED: Extracting Sentiments ---")
    
    if not search_results:
        return {
            "analysis_report": {
                "sentiment_summary": "No web text data available to analyze.",
                "pros": [],
                "cons": []
            },
            "logs": ["No web records available for sentiment extraction."]
        }
        
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        return {
            "analysis_report": {
                "sentiment_summary": "Review analyzer failed due to missing API configuration.",
                "pros": ["Error: Missing API Key"],
                "cons": []
            },
            "logs": ["Review analyzer aborted due to missing environment key."]
        }
        
    client = genai.Client(api_key=api_key)
    
    context_data = "\n".join([
        f"Snippet Title: {item.get('title')}\nSnippet Text: {item.get('content')}\n"
        for item in search_results
    ])
    
    prompt = f"""
    You are an expert consumer sentiment and review analyzer agent.
    Analyze the following raw web text data collected for the target product intent: "{query}".
    Synthesize user experiences, professional descriptions, market feedback, and retail details into a clean analysis.
    
    Return a clean JSON object containing EXACTLY these three keys:
    - "sentiment_summary": A single, impactful sentence summarizing the overall active market sentiment or consensus about this product/price segment.
    - "pros": A JSON array of strings containing up to 3 highly specific benefits, highlights, or strong selling points mentioned or implied in the text (e.g., 'Features powerful RTX 50-series GPUs', 'Excellent value under 90k'). Be concise and grounded in the text!
    - "cons": A JSON array of strings containing up to 2 specific drawbacks, limitations, risks, or performance warnings mentioned or implied in the text (e.g., 'Display brightness might be low', 'Limited battery backup notes'). If no clear cons are visible, provide a general market warning based on the segment (e.g., 'Expect standard base refresh rates at this tier').
    
    Raw Search Context:
    {context_data}
    """
    
    try:
        response = client.models.generate_content(
            model='gemini-2.5-flash',
            contents=prompt,
            config=types.GenerateContentConfig(
                response_mime_type="application/json",
                temperature=0.2
            )
        )
        
        extracted_report = json.loads(response.text)
        print(f"Successfully extracted live sentiment reports from context snippets.")
        
        return {
            "analysis_report": extracted_report,
            "logs": ["Successfully executed Review Analyzer parsing step with live Gemini extraction."]
        }
        
    except Exception as e:
        print(f"Gemini Sentiment Analysis Failure: {e}")
        return {
            "analysis_report": {
                "sentiment_summary": "Failed to analyze market sentiments gracefully.",
                "pros": [],
                "cons": []
            },
            "logs": [f"Review analyzer extraction failed: {str(e)}"]
        }