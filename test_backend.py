import asyncio
import httpx
import json

async def test_search():
    async with httpx.AsyncClient(timeout=300.0) as client:
        res = await client.post("http://localhost:8000/api/chat", json={"query": "Pentonic B RT Ball Pens, Blue Ink, 3 Pens Blister Set, Pack of 3"})
        with open("out.json", "w", encoding="utf-8") as f:
            json.dump(res.json(), f, indent=2)
        print("Success")

if __name__ == "__main__":
    asyncio.run(test_search())
