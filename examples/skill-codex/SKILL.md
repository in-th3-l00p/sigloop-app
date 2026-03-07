# Sigloop Codex Skill

- Always call `GET /v1/card/limits` and `GET /v1/card/policies` before spend decisions.
- Quote with `POST /v1/card/transactions/quote` before sending.
- Execute transfers with `POST /v1/card/transactions` and idempotency key.
- Never expose card secrets.
