import asyncio
import httpx

async def terminal_chat():
    print("=" * 50)
    print("SEAMAS ANTIGRAVITY API TERMINAL CLIENT ACTIVE")
    print("Type 'exit' or 'quit' to close the session.")
    print("=" * 50)

    url = "http://127.0.0.1:8000/api/chat"

    try:
        async with httpx.AsyncClient(timeout=180.0) as client:
            while True:
                try:
                    user_query = input("\n You: ")
                except (KeyboardInterrupt, EOFError):
                    print("\nClosing terminal session.")
                    return

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
                        print("\n" + data.get("final_output", "No compiled report available."))
                        print("\n" + "="*68)
                    else:
                        print(f" Server Error ({response.status_code}): {response.text}")

                except httpx.RequestError as e:
                    print(f"Connection Error: Make sure main.py is running! Details: {e}")
                except asyncio.CancelledError:
                    raise
                except Exception as e:
                    print(f"An unexpected error occurred: {e}")
    except asyncio.CancelledError:
        print("\nSession terminated.")

if __name__ == "__main__":
    try:
        asyncio.run(terminal_chat())
    except (KeyboardInterrupt, asyncio.CancelledError):
        print("\nSession terminated.")