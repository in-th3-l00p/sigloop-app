# API Service Reference

Base URL: `http://localhost:8788`

Auth header: `x-api-key: <your_key>`

Additional header for tx send: `idempotency-key: <unique_key>`

## Public

- `GET /health`
- `GET /openapi.json`

## Session

- `GET /v1/me` (`read`)

## API Keys

- `GET /v1/api-keys` (`admin`)
- `POST /v1/api-keys` (`admin`)
- `PATCH /v1/api-keys/:apiKeyId` (`admin`)
- `DELETE /v1/api-keys/:apiKeyId` (`admin`)

## Accounts

- `GET /v1/accounts` (`read`)
- `POST /v1/accounts` (`write`)
- `POST /v1/accounts/provision` (`tx`)
- `GET /v1/accounts/:accountId` (`read`)
- `PATCH /v1/accounts/:accountId` (`write`)
- `DELETE /v1/accounts/:accountId` (`write`)
- `GET /v1/accounts/:accountId/transactions` (`read`)
- `POST /v1/accounts/:accountId/transactions` (`tx`, idempotent)
- `GET /v1/accounts/:accountId/cards` (`read`)

## Cards

- `POST /v1/cards` (`write`)
- `GET /v1/cards/:cardId` (`read`)
- `PATCH /v1/cards/:cardId` (`write`)
- `DELETE /v1/cards/:cardId` (`write`)
- `GET /v1/cards/:cardId/transactions` (`read`)
- `GET /v1/cards/:cardId/integrations` (`read`)

## Integrations

- `POST /v1/integrations` (`write`)
- `PATCH /v1/integrations/:integrationId` (`write`)
- `DELETE /v1/integrations/:integrationId` (`write`)

## Contacts

- `GET /v1/contacts` (`read`)
- `POST /v1/contacts` (`write`)
- `DELETE /v1/contacts/:contactId` (`write`)
