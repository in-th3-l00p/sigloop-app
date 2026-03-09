import json
import os
import warnings

warnings.filterwarnings(
    "ignore",
    message="Core Pydantic V1 functionality isn't compatible with Python 3.14 or greater.",
)

from dotenv import load_dotenv
from langchain_core.messages import HumanMessage, ToolMessage
from langchain_openai import ChatOpenAI

from sigloop_wallet_tools import create_sigloop_wallet_tools

load_dotenv(".env.local")
load_dotenv()

tools = create_sigloop_wallet_tools(
    base_url=os.getenv("SIGLOOP_CARD_SERVICE_URL", "http://localhost:8080/api/card-service"),
    card_secret=os.getenv("SIGLOOP_CARD_SECRET", ""),
)

tool_map = {t.name: t for t in tools}
llm = ChatOpenAI(api_key=os.getenv("OPENAI_API_KEY"), model=os.getenv("OPENAI_MODEL", "gpt-4o-mini"), temperature=0)
llm_with_tools = llm.bind_tools(tools)
messages = [HumanMessage(content="Call card_summary and explain in 3 bullets.")]

for _ in range(6):
    ai_msg = llm_with_tools.invoke(messages)
    messages.append(ai_msg)
    calls = getattr(ai_msg, "tool_calls", None) or []
    if not calls:
        print(ai_msg.content)
        raise SystemExit(0)

    for call in calls:
        name = call.get("name")
        selected = tool_map.get(name)
        try:
            result = selected.invoke(call.get("args", {})) if selected else f"Unknown tool: {name}"
            payload = result if isinstance(result, str) else json.dumps(result)
            messages.append(ToolMessage(content=payload, tool_call_id=call.get("id"), name=name))
        except Exception as exc:  # noqa: BLE001
            messages.append(ToolMessage(content=f"Tool failed: {exc}", tool_call_id=call.get("id"), name=name))

raise RuntimeError("Agent exceeded iteration limit")
