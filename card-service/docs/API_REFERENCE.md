# API Reference

Base URL: `http://localhost:8787`

Auth header for protected routes:

```http
x-card-secret: sgl_demo_secret_123
```

## 1. Health

### `GET /health`
Returns service health.

## 2. OpenAPI schema

### `GET /openapi.json`
Returns OpenAPI 3.1 schema.

## 3. Card profile

### `GET /v1/card/me`
Returns card metadata (no secret).

## 4. Balance

### `GET /v1/card/balance`
Returns current card balance and spent amount.

## 5. Limits

### `GET /v1/card/limits`
Returns limit, spent, remaining, reset period, reset timestamp.

## 6. Policies

### `GET /v1/card/policies`
Returns policy list.

Supported policy types:
- `maxPerTx`
- `allowedRecipient`
- `allowedContract`

## 7. Summary

### `GET /v1/card/summary`
Returns profile, key spend numbers, and last 5 transactions.

## 8. Transaction history

### `GET /v1/card/transactions?limit=50`
Returns card transactions, newest first.

Query params:
- `limit` (optional, `1..200`, default `50`)

## 9. Transaction quote (preflight)

### `POST /v1/card/transactions/quote`
Runs policy + limit checks and returns quote details.

Request body:

```json
{
  "to": "0xBEEF000000000000000000000000000000000001",
  "value": "10000000000000000",
  "description": "optional"
}
```

## 10. Execute transaction

### `POST /v1/card/transactions`
Performs a transaction when checks pass.

Request body:

```json
{
  "to": "0xBEEF000000000000000000000000000000000001",
  "value": "10000000000000000",
  "description": "Bot payout"
}
```

Returns `201` with created transaction object.

## 11. Pause card

### `POST /v1/card/pause`
Sets card status to `paused`.

## 12. Resume card

### `POST /v1/card/resume`
Sets card status to `active`.

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
- `NOT_FOUND`
- `INTERNAL_ERROR`

## Example cURL

```bash
curl -s http://localhost:8787/v1/card/summary \
  -H 'x-card-secret: sgl_demo_secret_123'
```
