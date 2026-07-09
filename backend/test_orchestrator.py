import asyncio
from agents.orchestrator import seamas_orchestrator
from dotenv import load_dotenv
load_dotenv() 

async def test_seamas_pipeline():
    print("----- SEAMAS MULTI-AGENT SYSTEM TEST RUNNER-----")
    
    user_input = input("Enter product search query to test: ")
    if not user_input.strip():
        user_input = "Gaming Laptop under 80000 INR"
        
    print(f"\n Initializing Input State for: '{user_input}'...\n")
    
    initial_state = {
        "query": user_input,
        "search_results": [],
        "price_data": [],
        "analysis_report": {},
        "recommendations": [],
        "budget_status": {},
        "logs": [f"Triggered manually with query: '{user_input}'."]
    }
    
    print("Invoking graph execution loop...")
    final_output = await seamas_orchestrator.ainvoke(initial_state)
    
    print("EXECUTION COMPLETE - OUTPUT DATA DUMP          ")
    print(f"Target Query: {final_output.get('query')}")
    
    print("\n SEARCH AGENT DATA PAYLOAD:")
    search_res = final_output.get('search_results', [])
    for idx, item in enumerate(search_res, 1):
        print(f"  {idx}. [{item.get('engine').upper()}] {item.get('title')} -> {item.get('content')}")
        
    print("\n PRICE COMPARISON DATA MATRIX:")
    price_matrix = final_output.get('price_data', [])
    if price_matrix:
        for idx, item in enumerate(price_matrix, 1):
            print(f"  {idx}. Product: {item.get('product_name')} | Store: {item.get('marketplace')} | Extracted Price: ₹{item.get('extracted_price')} | Status: {item.get('status')}")
    else:
        print("  No pricing data populated.")
        
    print("\n REVIEW ANALYZER DATA REPORT:")
    analysis = final_output.get('analysis_report', {})
    print(f" Sentiment Summary: {analysis.get('sentiment_summary')}")
    print(f" Pros Identified: {', '.join(analysis.get('pros', []))}")
    print(f" Cons Identified: {', '.join(analysis.get('cons', []))}")
    
    print("\n COMPLETE SEQUENCE TRAVERSAL LOGS:")
    for log in final_output.get("logs", []):
        print(f"  - {log}")

if __name__ == "__main__":
    asyncio.run(test_seamas_pipeline())