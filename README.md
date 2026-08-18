# 🛍️ SEAMAS: Smart E-Commerce Multi-Agent System

SEAMAS (Smart E-Commerce Multi-Agent System) is a state-of-the-art multi-agent shopping assistant. It leverages collaborative AI agents structured via **LangGraph** (or a custom pipeline orchestrator) to search, scrape live prices, analyze consumer sentiment, and provide budget-conforming product recommendations in real-time.

---

## 🏗️ System Architecture

SEAMAS coordinates multiple specialized agents asynchronously. The flow of a typical user request is visualized below:

```mermaid
graph TD
    User([User Query]) --> API[FastAPI Backend]
    
    subgraph Billing & Cache
        API --> DB_Check{Check Credits}
        DB_Check -- Insufficient --> Denied[HTTP 402 Payment Required]
        DB_Check -- Sufficient --> Deduct[Deduct Credits]
        Deduct --> Cache_Check{Cache Lookup}
        Cache_Check -- Hit --> ReturnCache[Stream Cached Result]
    end
    
    Cache_Check -- Miss --> Workflow[Agent Workflow Engine]
    
    subgraph Multi-Agent System (LangGraph)
        Workflow --> SearchAgent[1. Search Agent]
        SearchAgent --> |SearXNG / Tavily| RawResults[Raw Web Results]
        
        RawResults --> PriceAgent[2. Price Agent]
        RawResults --> ReviewAgent[3. Review Agent]
        RawResults --> BudgetAgent[4. Budget Agent]
        
        PriceAgent --> |HTTPX Scraper + Selectors| LivePrices[Live Prices]
        ReviewAgent --> |Ollama / Qwen2.5| SentimentReport[Sentiment Synthesis]
        BudgetAgent --> |Regex/Currency parser| BudgetLimits[Budget Assessment]
        
        LivePrices --> RecAgent[5. Recommendation Agent]
        SentimentReport --> RecAgent
        BudgetLimits --> RecAgent
        
        RecAgent --> Finalizer[6. Finalizer Agent]
    end
    
    Finalizer --> Output[Synthesized MD Report]
    ReturnCache --> Output
    Output --> UI[React Frontend Dashboard]
```

### The Multi-Agent Lineup
1. 🔍 **Search Agent**: Queries SearXNG (or Tavily as a fallback) to retrieve raw product page links and listings.
2. 🏷️ **Price Comparison Agent**: Asynchronously scrapes the target web links using tailored CSS selectors (for Amazon, Flipkart, Croma, Myntra, and Reliance Digital) and generic regex patterns to resolve price mismatches.
3. 💬 **Review Analyzer Agent**: Synthesizes qualitative consumer feedback using **Ollama** running `qwen2.5` to construct structured pros/cons analysis.
4. 💰 **Budget Advisor Agent**: Extracts budget constraints from semantic query inputs (e.g. "under 50k", "around Rs. 15,000").
5. 💡 **Recommendation Agent**: Compares scraped prices, targets budget fits, flags verified bargains, and flags the best verified deals.
6. 📝 **Finalizer Agent**: Consolidates results into a clean markdown document for the user.

---

## ✨ Features

* **LangGraph Multi-Agent Coordination**: Asynchronous processing with node-by-node execution streamed directly to the frontend.
* **Anti-Price Mismatch Engine**: Scrapes target marketplaces directly rather than relying on outdated search engine snippets.
* **Local LLM Integration**: Uses Ollama with lightweight, fast models (`qwen2.5`) for semantic synthesis without remote API costs.
* **Credit & Plan Management**: Supports Free (50 credits) and Pro tiers (500 credits per upgrade), with credits deducted dynamically based on query accuracy mode.
* **Simulated Payments**: Integration with Razorpay (using callback endpoints) to buy Pro upgrades.
* **Modern Dashboard**: Visually rich dashboard built with React, Vite, Tailwind CSS, and Lucide Icons, featuring live agent tracking step animations, wishlist management, search history, and credit monitors.

---

## ⚙️ Prerequisites

Ensure you have the following installed on your machine:
* **Python 3.10 or 3.11**
* **Node.js 18+** & **npm**
* **Docker** (to run SearXNG)
* **Ollama** (for local AI analysis)
* **Supabase Account** (for authentication, history, caching, and profile data)

---

## 🚀 Setup & Installation

Follow these steps to run SEAMAS locally:

### 1. Database Configuration (Supabase)
Create a new project on [Supabase](https://supabase.com/) and run the contents of `supabase_schema.sql` in the SQL Editor. This will create:
* `profiles` (User settings, tiers, search credits)
* `search_history` (Tracking queries)
* `wishlists` (User-saved items)
* `cached_results` (Speeding up frequent queries)
* Database triggers to automatically initialize profiles for newly registered users.

---

### 2. Search Engine Setup (SearXNG)
To provide real-time shopping results without costly search engine APIs, spin up a local instance of SearXNG:
```bash
cd backend
docker-compose up -d
```
> [!NOTE]
> SearXNG will run on `http://localhost:8080`. The configuration mounts `backend/searxng-deploy/settings.yml` to configure engine scraping patterns for Google and Bing.

---

### 3. Local LLM Setup (Ollama)
1. Download and install [Ollama](https://ollama.com/).
2. Start Ollama on your system.
3. Pull the required model:
   ```bash
   ollama pull qwen2.5
   ```

---

### 4. Backend Setup
1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Create a virtual environment and activate it:
   ```bash
   # On Windows (PowerShell):
   python -m venv venv
   .\venv\Scripts\Activate.ps1

   # On Linux/macOS:
   python3 -m venv venv
   source venv/bin/activate
   ```
3. Install the dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Create a `.env` file inside the `backend` directory based on the following template:
   ```env
   # API Configuration
   SEARXNG_BASE_URL=http://localhost:8080 # Or Docker url if deployed
   TAVILY_API_KEY=your_tavily_key_here     # Optional fallback key
   AGENT_MODE=graph                       # "graph" for LangGraph workflow, "orchestrator" for linear pipeline
   OLLAMA_HOST=http://localhost:11434

   # Supabase Keys
   SUPABASE_URL=https://your-project-id.supabase.co
   SUPABASE_ANON_KEY=your-supabase-anon-key
   SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key

   # Razorpay Keys
   RAZORPAY_KEY_ID=your_razorpay_key_id
   RAZORPAY_KEY_SECRET=your_razorpay_key_secret
   ```
5. Run the FastAPI development server:
   ```bash
   python app/main.py
   ```
   The backend API will run on `http://127.0.0.1:8000`.

---

### 5. Frontend Setup
1. Navigate to the frontend directory:
   ```bash
   cd ../frontend
   ```
2. Install npm dependencies:
   ```bash
   npm install
   ```
3. Create a `.env` file inside the `frontend` directory:
   ```env
   VITE_SUPABASE_URL=https://your-project-id.supabase.co
   VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
   ```
4. Run the Vite development server:
   ```bash
   npm run dev
   ```
   The frontend application will start on `http://localhost:5173`.

---

## 🧪 Testing the Application

### 1. Verification of Price Matching
1. Sign up/Log in via the Frontend interface.
2. Search for a product (e.g., `iPhone 15 Pro under 1.2 Lakh`).
3. Observe the logs in your Backend console to monitor real-time scraping.
4. Verify that prices displayed match the current live price by clicking on the **View** button.

### 2. Credit Deductions and Upgrades
* Running queries in **Speed** mode costs 5 credits, **Balanced** costs 10 credits, and **Accuracy** costs 20 credits.
* If your credit balance drops to 0, click on **Upgrade to Pro** on the User Dashboard. This redirects you to a Razorpay transaction simulation (set to 1 INR for testing). Upon successful payment, your credits will be bumped to 500!

---

## 🛠️ Tech Stack

* **Frontend**: React.js, Vite, Tailwind CSS, Lucide icons, Supabase Auth.
* **Backend**: FastAPI, LangGraph, LangChain, Pydantic, Httpx (async crawling), BeautifulSoup4.
* **Databases**: Supabase (PostgreSQL), SQLite (Local logs).
* **Search Engine**: SearXNG, Tavily API.
* **Local Inference**: Ollama (`qwen2.5` model).
