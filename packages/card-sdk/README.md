# @sigloop/card

TypeScript SDK for Sigloop `card-service`.

## Install

```bash
npm i @sigloop/card
```

## Quick start

```ts
import { createCardClient } from "@sigloop/card"

const card = createCardClient({
  baseUrl: "https://your-card-service.example.com",
  cardSecret: "sgl_...",
})

const summary = await card.summary()
console.log(summary.balance)
```

## Browser compatibility

- Uses standard `fetch` and `AbortController`.
- Works in modern browsers and Node 18+.
- You can inject a custom `fetch` implementation via client options.

## Methods

- `health()`
- `openApi()`
- `me()`
- `balance()`
- `limits()`
- `policies()`
- `summary()`
- `transactions({ limit? })`
- `quoteTransaction({ to, value, description? })`
- `createTransaction({ to, value, description? }, { idempotencyKey? })`
- `pause()`
- `resume()`

## Idempotency

`createTransaction` auto-generates an `idempotency-key` if not provided.

```ts
await card.createTransaction(
  { to: "0x...", value: "1000000000000000" },
  { idempotencyKey: "my-stable-key" },
)
```

## Errors

The SDK throws typed errors:

- `CardApiError` (HTTP/application errors)
- `CardTimeoutError` (request timeout)
- `CardNetworkError` (transport failures)

## CLI / tool adapters

The client supports `beforeRequest` and `afterResponse` hooks for logging/tracing, useful for CLI and LangChain.js wrappers.
