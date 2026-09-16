import sys
import time
from datetime import datetime
from typing import Optional, List

# Reconfigure stdout/stderr for UTF-8 on Windows safely with replace error handler
try:
    if sys.stdout and hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    if sys.stderr and hasattr(sys.stderr, "reconfigure"):
        sys.stderr.reconfigure(encoding="utf-8", errors="replace")
except Exception:
    pass

# ANSI terminal colors
CYAN = "\033[96m"
GREEN = "\033[92m"
YELLOW = "\033[93m"
BLUE = "\033[94m"
MAGENTA = "\033[95m"
RED = "\033[91m"
BOLD = "\033[1m"
DIM = "\033[2m"
RESET = "\033[0m"

AGENT_METADATA = {
    "search": {
        "num": 1,
        "name": "Search Agent",
        "desc": "Sweeps 14 marketplaces in parallel",
        "tag": "[SEARCH]"
    },
    "budget": {
        "num": 2,
        "name": "Budget Advisor Agent",
        "desc": "Parses intent, budget & constraints",
        "tag": "[BUDGET]"
    },
    "reviews": {
        "num": 3,
        "name": "Review Analyzer Agent",
        "desc": "Distills 12k+ verified reviews & sentiment",
        "tag": "[REVIEWS]"
    },
    "price": {
        "num": 4,
        "name": "Price Comparison Agent",
        "desc": "Cross-checks history, deals & live prices",
        "tag": "[PRICING]"
    },
    "recommendation": {
        "num": 5,
        "name": "Recommendation Agent",
        "desc": "Ranks candidates against user intent",
        "tag": "[RECOMMEND]"
    },
    "finalizer": {
        "num": 6,
        "name": "Finalizer Agent",
        "desc": "Confirms stock, warranty & compiles report",
        "tag": "[FINALIZER]"
    }
}


def _ts() -> str:
    """Current timestamp in HH:MM:SS format."""
    return datetime.now().strftime("%H:%M:%S")


def _safe_print(text: str):
    """Safely prints text to stdout handling any potential encoding fallback."""
    try:
        print(text, flush=True)
    except UnicodeEncodeError:
        # Fallback to ascii replacement if terminal encoding is strictly limited
        safe_text = text.encode("ascii", errors="replace").decode("ascii")
        print(safe_text, flush=True)


def log_pipeline_start(query: str, steering_mode: str = "balanced"):
    """Prints a prominent visual banner when the multi-agent pipeline starts."""
    border = "=" * 80
    _safe_print(f"\n{CYAN}{BOLD}{border}{RESET}")
    _safe_print(f"{CYAN}{BOLD}[{_ts()}] >>> SEAMAS MULTI-AGENT PIPELINE INITIALIZED <<<{RESET}")
    _safe_print(f"{CYAN}  ↳ Query:        {BOLD}'{query}'{RESET}")
    _safe_print(f"{CYAN}  ↳ Steering:     {BOLD}{steering_mode.upper()}{RESET}")
    _safe_print(f"{CYAN}  ↳ Team:         {BOLD}6 Autonomous Specialists In Lockstep{RESET}")
    _safe_print(f"{CYAN}{BOLD}{border}{RESET}\n")


def log_agent_start(agent_id: str, detail: Optional[str] = None):
    """Prints when a specific agent begins processing."""
    meta = AGENT_METADATA.get(agent_id, {"num": "?", "name": agent_id, "desc": "", "tag": "[AGENT]"})
    num = meta["num"]
    name = meta["name"]
    action = detail or meta["desc"]

    _safe_print(
        f"{YELLOW}{BOLD}[{_ts()}] [{num}/6 {name.upper()}] ● RUNNING{RESET} {YELLOW}- {action}{RESET}"
    )


def log_agent_progress(agent_id: str, message: str):
    """Prints a sub-step progress update from an active agent."""
    meta = AGENT_METADATA.get(agent_id, {"num": "?", "name": agent_id})
    name = meta["name"]
    _safe_print(f"{DIM}[{_ts()}]   ↳ [{name}] {message}{RESET}")


def log_agent_complete(agent_id: str, summary: str, duration: float):
    """Prints when an agent successfully finishes its task."""
    meta = AGENT_METADATA.get(agent_id, {"num": "?", "name": agent_id})
    num = meta["num"]
    name = meta["name"]

    _safe_print(
        f"{GREEN}{BOLD}[{_ts()}] [{num}/6 {name.upper()}] ✔ COMPLETED ({duration:.2f}s){RESET} {GREEN}- {summary}{RESET}"
    )


def log_agent_error(agent_id: str, error_msg: str, duration: float):
    """Prints when an agent encounters an error."""
    meta = AGENT_METADATA.get(agent_id, {"num": "?", "name": agent_id})
    num = meta["num"]
    name = meta["name"]

    _safe_print(
        f"{RED}{BOLD}[{_ts()}] [{num}/6 {name.upper()}] ✖ ERROR ({duration:.2f}s){RESET} {RED}- {error_msg}{RESET}"
    )


def log_parallel_phase_start(agent_ids: List[str]):
    """Logs the launch of concurrent parallel agents."""
    names = [AGENT_METADATA.get(a, {}).get("name", a) for a in agent_ids]
    _safe_print(f"\n{BLUE}{BOLD}[{_ts()}] [PARALLEL STAGE] Launching {len(agent_ids)} Concurrent Agents{RESET}")
    _safe_print(f"{BLUE}  ↳ Concurrent Nodes: {', '.join(names)}{RESET}")


def log_pipeline_complete(query: str, total_duration: float, result_count: int):
    """Prints a closing banner when all agents finish."""
    border = "=" * 80
    _safe_print(f"\n{GREEN}{BOLD}{border}{RESET}")
    _safe_print(f"{GREEN}{BOLD}[{_ts()}] >>> PIPELINE COMPLETE | 6/6 AGENTS FINISHED ({total_duration:.2f}s) <<<{RESET}")
    _safe_print(f"{GREEN}  ↳ Query:        '{query}'{RESET}")
    _safe_print(f"{GREEN}  ↳ Output:       {result_count} verified product offers ready{RESET}")
    _safe_print(f"{GREEN}{BOLD}{border}{RESET}\n")
