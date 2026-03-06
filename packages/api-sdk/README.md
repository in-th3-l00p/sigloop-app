# @sigloop/api

TypeScript SDK for Sigloop `api-service`.

## Install

```bash
npm i @sigloop/api
```

## Quick start

```ts
import { createApiClient } from "@sigloop/api"

const api = createApiClient({
  baseUrl: "https://your-api-service.example.com",
  apiKey: "sgapi_...",
})

const accounts = await api.listAccounts()
console.log(accounts.accounts)
```

## Browser compatibility

- Uses standard `fetch` and `AbortController`.
- Works in modern browsers and Node 18+.
- You can inject a custom `fetch` implementation via client options.

## Methods

- `health()`
- `openApi()`
- `me()`
- `listApiKeys()` / `createApiKey()` / `updateApiKeyPolicy()` / `revokeApiKey()`
- `listAccounts()` / `createAccount()` / `provisionAccount()` / `getAccount()` / `updateAccount()` / `removeAccount()`
- `listAccountTransactions()` / `sendTransaction()`
- `listAccountCards()`
- `createCard()` / `getCard()` / `updateCard()` / `removeCard()`
- `listCardTransactions()` / `listCardIntegrations()`
- `createIntegration()` / `updateIntegration()` / `removeIntegration()`
- `listContacts()` / `createContact()` / `removeContact()`

## Idempotency

`sendTransaction` auto-generates an `idempotency-key` if not provided.

```ts
await api.sendTransaction(
  "acc_...",
  { to: "0x...", value: "1000000000000000" },
  { idempotencyKey: "my-stable-key" },
)
```

## Errors

The SDK throws typed errors:

- `ApiApiError` (HTTP/application errors)
- `ApiTimeoutError` (request timeout)
- `ApiNetworkError` (transport failures)

## CLI / tool adapters

The client supports `beforeRequest` and `afterResponse` hooks for logging/tracing, useful for CLI and LangChain.js wrappers.
