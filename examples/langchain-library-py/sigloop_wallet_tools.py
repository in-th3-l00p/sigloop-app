from __future__ import annotations

import uuid
from typing import Any

import requests
from langchain_core.tools import tool

__all__ = ["create_sigloop_wallet_tools"]


def create_sigloop_wallet_tools(base_url: str = "https://card.sigloop.online", card_secret: str = "", timeout: float = 30.0):
    """Return LangChain tools for Sigloop wallet interactions."""

    def _request(method: str, path: str, *, body: dict[str, Any] | None = None, params: dict[str, Any] | None = None, extra_headers: dict[str, str] | None = None) -> str:
        headers = {
            "x-card-secret": card_secret,
            "content-type": "application/json",
        }
        if extra_headers:
            headers.update(extra_headers)
        response = requests.request(method, f"{base_url}{path}", headers=headers, json=body, params=params, timeout=timeout)
        response.raise_for_status()
        if not response.text:
            return "{}"
        return response.text

    @tool
    def card_me() -> str:
        """Get wallet metadata."""
        return _request("GET", "/v1/card/me")

    @tool
    def card_balance() -> str:
        """Get wallet balance."""
        return _request("GET", "/v1/card/balance")

    @tool
    def card_limits() -> str:
        """Get wallet limits."""
        return _request("GET", "/v1/card/limits")

    @tool
    def card_policies() -> str:
        """Get wallet policies."""
        return _request("GET", "/v1/card/policies")

    @tool
    def card_summary() -> str:
        """Get wallet summary."""
        return _request("GET", "/v1/card/summary")

    @tool
    def card_transactions(limit: int = 10) -> str:
        """List wallet transactions."""
        safe_limit = max(1, min(int(limit), 50))
        return _request("GET", "/v1/card/transactions", params={"limit": safe_limit})

    @tool
    def card_quote_transaction(to: str, value_wei: str, description: str = "") -> str:
        """Quote a transaction."""
        body = {"to": to, "value": value_wei}
        if description:
            body["description"] = description
        return _request("POST", "/v1/card/transactions/quote", body=body)

    @tool
    def card_send_transaction(to: str, value_wei: str, description: str = "") -> str:
        """Execute a transaction."""
        body = {"to": to, "value": value_wei}
        if description:
            body["description"] = description
        idem = f"langchain-py-{uuid.uuid4()}"
        return _request("POST", "/v1/card/transactions", body=body, extra_headers={"idempotency-key": idem})

    @tool
    def card_pause() -> str:
        """Pause the wallet/card."""
        return _request("POST", "/v1/card/pause")

    @tool
    def card_resume() -> str:
        """Resume the wallet/card."""
        return _request("POST", "/v1/card/resume")

    return [
        card_me,
        card_balance,
        card_limits,
        card_policies,
        card_summary,
        card_transactions,
        card_quote_transaction,
        card_send_transaction,
        card_pause,
        card_resume,
    ]
