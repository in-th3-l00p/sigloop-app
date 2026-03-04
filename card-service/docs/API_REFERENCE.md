# API Reference

Base URL: `http://localhost:8787`

Auth header:

```http
x-card-secret: sgl_...
```

All protected routes resolve card + account context from Convex using the secret.

## Endpoints

1. `GET /health`
Service health.

2. `GET /openapi.json`
OpenAPI 3.1 schema.

3. `GET /v1/card/me`
Card + account profile (no secret, no private key).

4. `GET /v1/card/balance`
Live onchain balance (via ZeroDev RPC for the card account chain).

5. `GET /v1/card/limits`
Current card limit window values:
- `limit`
- `spent`
- `remaining`
- `resetPeriod`
- `resetAt`

6. `GET /v1/card/policies`
Policy list (e.g. `maxPerTx`, `allowedRecipient`, `allowedContract`).

7. `GET /v1/card/summary`
Profile + live balance + last 5 card transactions.

8. `GET /v1/card/transactions?limit=50`
Transaction history (Convex `transactions` linked by `agentCardId`).

9. `POST /v1/card/transactions/quote`
Policy/limit/balance preflight check.

Request body:

```json
{
  "to": "0xBEEF000000000000000000000000000000000001",
  "value": "10000000000000000",
  "description": "optional"
}
```

10. `POST /v1/card/transactions`
Sends a transaction with ZeroDev kernel and records it in Convex.

Request body:

```json
{
  "to": "0xBEEF000000000000000000000000000000000001",
  "value": "10000000000000000",
  "description": "Bot payout"
}
```

Returns `201`.

11. `POST /v1/card/pause`
Set card status to `paused` in Convex.

12. `POST /v1/card/resume`
Set card status to `active` in Convex.

## Error format

```json
{
  "error": {
    "code": "CARD_LIMIT_EXCEEDED",
    "message": "Card spending limit exceeded"
  }
}
```

Common codes:
- `MISSING_SECRET`
- `INVALID_SECRET`
- `CARD_PAUSED`
- `INVALID_AMOUNT`
- `INSUFFICIENT_BALANCE`
- `CARD_LIMIT_EXCEEDED`
- `MAX_PER_TX_EXCEEDED`
- `RECIPIENT_NOT_ALLOWED`
- `CONTRACT_NOT_ALLOWED`
- `CHAIN_SEND_FAILED`
- `CONVEX_TX_RECORD_FAILED`
- `NOT_FOUND`
- `INTERNAL_ERROR`
