import asyncio
import httpx

async def terminal_chat():
    print("=" * 50)
    print("SEAMAS ANTIGRAVITY API TERMINAL CLIENT ACTIVE")
    print("Type 'exit' or 'quit' to close the session.")
    print("=" * 50)

    url = "http://127.0.0.1:8000/api/chat"

    async with httpx.AsyncClient(timeout=180.0) as client:
        while True:
            user_query = input("\n You: ")
            if user_query.strip().lower() in ['exit', 'quit']:
                print("Closing terminal session.")
                break
                
            if not user_query.strip():
                continue

            print("Sending request to FastAPI server and routing through agents...")
            
            try:
                response = await client.post(url, json={"query": user_query})
                
                if response.status_code == 200:
                    data = response.json()
                    
                    print("\n" + "="*25 + " SERVER RESPONSE " + "="*25)
                    
                    report = data.get("analysis_report", {})
                    print(f"\n SENTIMENT SUMMARY:\n   {report.get('sentiment_summary', 'No summary parsed.')}")
                    
                    print("\n PROS:")
                    for pro in report.get("pros", []):
                        print(f"   • {pro}")
                        
                    print("\n CONS:")
                    for con in report.get("cons", []):
                        print(f"   • {con}")
                        
                    print("\n EXTRACTED PRICES:")
                    prices = data.get("price_data", [])
                    if prices:
                        for p in prices:
                            print(f"[{p.get('marketplace')}] {p.get('product_name')} -> Rs. {p.get('extracted_price')} ({p.get('status')})")
                    else:
                        print("No price points extracted.")
                        
                    print("\n" + "="*68)
                else:
                    print(f" Server Error ({response.status_code}): {response.text}")
                    
            except Exception as e:
                print(f"Connection Error: Make sure main.py is running! Details: {e}")

if __name__ == "__main__":
    asyncio.run(terminal_chat())