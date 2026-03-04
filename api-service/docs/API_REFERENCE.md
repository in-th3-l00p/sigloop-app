# API Service Reference

Base URL: `http://localhost:8788`

Auth header: `x-api-key: <your_key>`

## Public

- `GET /health`
- `GET /openapi.json`

## Session

- `GET /v1/me`

## Accounts

- `GET /v1/accounts`
- `POST /v1/accounts`
- `POST /v1/accounts/provision`
- `GET /v1/accounts/:accountId`
- `PATCH /v1/accounts/:accountId`
- `DELETE /v1/accounts/:accountId`
- `GET /v1/accounts/:accountId/transactions`
- `POST /v1/accounts/:accountId/transactions`
- `GET /v1/accounts/:accountId/cards`

## Cards

- `POST /v1/cards`
- `GET /v1/cards/:cardId`
- `PATCH /v1/cards/:cardId`
- `DELETE /v1/cards/:cardId`
- `GET /v1/cards/:cardId/transactions`
- `GET /v1/cards/:cardId/integrations`

## Integrations

- `POST /v1/integrations`
- `PATCH /v1/integrations/:integrationId`
- `DELETE /v1/integrations/:integrationId`

## Contacts

- `GET /v1/contacts`
- `POST /v1/contacts`
- `DELETE /v1/contacts/:contactId`
