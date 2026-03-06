import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { CodeBlock, DocSection, DocSubSection, EndpointBlock } from "./code-block"

export function CardServiceDocs() {
  return (
    <div className="space-y-8">
      <div>
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-bold tracking-tight">Card Service</h1>
          <Badge variant="outline">v0.2.0</Badge>
        </div>
        <p className="text-muted-foreground mt-2">
          Secret-authenticated REST API for agent card operations. Each card has a unique
          secret that scopes all requests to that card's balance, limits, and policies.
        </p>
      </div>

      <Separator />

      <DocSection title="Base URL">
        <CodeBlock>{`http://localhost:8787`}</CodeBlock>
        <p className="text-xs text-muted-foreground mt-2">
          Set via <code className="bg-muted px-1 py-0.5 rounded">VITE_CARD_SERVICE_URL</code> environment variable.
        </p>
      </DocSection>

      <DocSection title="Authentication">
        <p className="text-sm text-muted-foreground">
          All <code className="bg-muted px-1 py-0.5 rounded text-xs">/v1/card/*</code> endpoints
          require the <code className="bg-muted px-1 py-0.5 rounded text-xs">x-card-secret</code> header.
          The secret is generated when a card is created and maps 1:1 to a specific agent card.
        </p>
        <CodeBlock title="Request Header">{`x-card-secret: sgl_your_card_secret_here`}</CodeBlock>
      </DocSection>

      <DocSection title="API Endpoints">
        <DocSubSection title="Health & Discovery">
          <div className="space-y-3">
            <EndpointBlock
              method="GET"
              path="/health"
              description="Service health check. No authentication required."
              response={`{ "ok": true, "service": "card-service" }`}
            />
            <EndpointBlock
              method="GET"
              path="/openapi.json"
              description="OpenAPI 3.1 schema. No authentication required."
            />
          </div>
        </DocSubSection>

        <DocSubSection title="Card Identity">
          <EndpointBlock
            method="GET"
            path="/v1/card/me"
            description="Returns the card's profile: id, name, status, chain, account address, and creation timestamp."
            response={`{
  "id": "abc123",
  "accountId": "acc456",
  "accountAddress": "0x1234...abcd",
  "name": "Trading Agent",
  "status": "active",
  "chain": "sepolia",
  "createdAt": 1709683200000
}`}
          />
        </DocSubSection>

        <DocSubSection title="Balance & Limits">
          <div className="space-y-3">
            <EndpointBlock
              method="GET"
              path="/v1/card/balance"
              description="Live on-chain balance of the card's parent account, plus current spend tracking."
              response={`{
  "balance": "1000000000000000000",
  "currency": "ETH",
  "chain": "sepolia",
  "spent": "250000000000000000"
}`}
            />
            <EndpointBlock
              method="GET"
              path="/v1/card/limits"
              description="Spending limit details and reset window. remaining is null if no limit is set."
              response={`{
  "limit": "500000000000000000",
  "spent": "250000000000000000",
  "remaining": "250000000000000000",
  "resetPeriod": "daily",
  "resetAt": 1709769600000
}`}
            />
          </div>
        </DocSubSection>

        <DocSubSection title="Policies & Summary">
          <div className="space-y-3">
            <EndpointBlock
              method="GET"
              path="/v1/card/policies"
              description="Active policy rules enforced on every transaction."
              response={`{
  "policies": [
    { "type": "maxPerTx", "value": "100000000000000000" },
    { "type": "allowedRecipient", "value": "0xabcd...1234" }
  ]
}`}
            />
            <EndpointBlock
              method="GET"
              path="/v1/card/summary"
              description="Complete card snapshot: card info, balance, limits, and recent transactions."
              response={`{
  "card": { "id": "abc123", "name": "Trading Agent", "status": "active" },
  "balance": "1000000000000000000",
  "limit": "500000000000000000",
  "spent": "250000000000000000",
  "recentTransactions": [...]
}`}
            />
          </div>
        </DocSubSection>

        <DocSubSection title="Transactions">
          <div className="space-y-3">
            <EndpointBlock
              method="GET"
              path="/v1/card/transactions"
              description="List transaction history. Supports ?limit query parameter (1-200)."
              response={`{
  "transactions": [
    {
      "hash": "0xabc...",
      "from": "0x1234...",
      "to": "0x5678...",
      "value": "100000000000000",
      "direction": "out",
      "status": "success",
      "chain": "sepolia"
    }
  ]
}`}
            />
            <EndpointBlock
              method="POST"
              path="/v1/card/transactions/quote"
              description="Preflight check: validates policies, limits, and balance before executing. Does not submit a transaction."
              body={`{
  "to": "0x5678...abcd",
  "value": "100000000000000",
  "description": "Payment for API call"
}`}
              response={`{
  "allowed": true,
  "quote": {
    "amount": "100000000000000",
    "networkFee": "21000000000000",
    "total": "121000000000000"
  }
}`}
            />
            <EndpointBlock
              method="POST"
              path="/v1/card/transactions"
              description="Execute a transaction. Requires idempotency-key header. Validates policies, limits, and balance, then submits via ZeroDev Kernel."
              body={`{
  "to": "0x5678...abcd",
  "value": "100000000000000",
  "description": "Payment for API call"
}

Header: idempotency-key: unique_key_per_intent`}
              response={`{
  "transaction": {
    "hash": "0xabc...",
    "from": "0x1234...",
    "to": "0x5678...",
    "value": "100000000000000",
    "direction": "out",
    "status": "progress",
    "chain": "sepolia"
  }
}`}
            />
          </div>
        </DocSubSection>

        <DocSubSection title="Card Control">
          <div className="space-y-3">
            <EndpointBlock
              method="POST"
              path="/v1/card/pause"
              description="Pause the card. Paused cards reject all transactions."
              response={`{ "status": "paused" }`}
            />
            <EndpointBlock
              method="POST"
              path="/v1/card/resume"
              description="Resume a paused card."
              response={`{ "status": "active" }`}
            />
          </div>
        </DocSubSection>
      </DocSection>

      <Separator />

      <DocSection title="Card SDK (@sigloop/card-sdk)">
        <p className="text-sm text-muted-foreground">
          TypeScript SDK that wraps the Card Service API. Works in Node.js, browsers, and
          edge runtimes. Zero dependencies beyond the standard Fetch API.
        </p>

        <DocSubSection title="Installation">
          <CodeBlock title="npm">{`npm install @sigloop/card-sdk`}</CodeBlock>
        </DocSubSection>

        <DocSubSection title="Quick Start">
          <CodeBlock title="JavaScript">{`import { createCardClient } from "@sigloop/card-sdk"

const card = createCardClient({
  baseUrl: "http://localhost:8787",
  cardSecret: "sgl_your_card_secret",
})

// Get card profile
const profile = await card.me()
console.log(profile.name, profile.status)

// Check balance
const { balance, spent } = await card.balance()

// Get full summary
const summary = await card.summary()`}</CodeBlock>
        </DocSubSection>

        <DocSubSection title="Constructor Options">
          <div className="rounded-lg border border-border overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="px-3 py-2 text-left font-medium">Option</th>
                  <th className="px-3 py-2 text-left font-medium">Type</th>
                  <th className="px-3 py-2 text-left font-medium">Default</th>
                  <th className="px-3 py-2 text-left font-medium">Description</th>
                </tr>
              </thead>
              <tbody className="text-muted-foreground">
                <tr className="border-b border-border">
                  <td className="px-3 py-2 font-mono text-xs">baseUrl</td>
                  <td className="px-3 py-2 text-xs">string</td>
                  <td className="px-3 py-2 text-xs">required</td>
                  <td className="px-3 py-2 text-xs">Card Service URL</td>
                </tr>
                <tr className="border-b border-border">
                  <td className="px-3 py-2 font-mono text-xs">cardSecret</td>
                  <td className="px-3 py-2 text-xs">string</td>
                  <td className="px-3 py-2 text-xs">-</td>
                  <td className="px-3 py-2 text-xs">Card secret for auth</td>
                </tr>
                <tr className="border-b border-border">
                  <td className="px-3 py-2 font-mono text-xs">timeoutMs</td>
                  <td className="px-3 py-2 text-xs">number</td>
                  <td className="px-3 py-2 text-xs">15000</td>
                  <td className="px-3 py-2 text-xs">Request timeout in ms</td>
                </tr>
                <tr className="border-b border-border">
                  <td className="px-3 py-2 font-mono text-xs">fetch</td>
                  <td className="px-3 py-2 text-xs">typeof fetch</td>
                  <td className="px-3 py-2 text-xs">globalThis.fetch</td>
                  <td className="px-3 py-2 text-xs">Custom fetch implementation</td>
                </tr>
                <tr className="border-b border-border">
                  <td className="px-3 py-2 font-mono text-xs">headers</td>
                  <td className="px-3 py-2 text-xs">Record</td>
                  <td className="px-3 py-2 text-xs">-</td>
                  <td className="px-3 py-2 text-xs">Extra headers on every request</td>
                </tr>
                <tr className="border-b border-border">
                  <td className="px-3 py-2 font-mono text-xs">beforeRequest</td>
                  <td className="px-3 py-2 text-xs">function</td>
                  <td className="px-3 py-2 text-xs">-</td>
                  <td className="px-3 py-2 text-xs">Hook called before each request</td>
                </tr>
                <tr>
                  <td className="px-3 py-2 font-mono text-xs">afterResponse</td>
                  <td className="px-3 py-2 text-xs">function</td>
                  <td className="px-3 py-2 text-xs">-</td>
                  <td className="px-3 py-2 text-xs">Hook called after each response</td>
                </tr>
              </tbody>
            </table>
          </div>
        </DocSubSection>

        <DocSubSection title="Checking Limits & Policies">
          <CodeBlock title="JavaScript">{`const limits = await card.limits()
console.log("Remaining:", limits.remaining)
console.log("Resets at:", new Date(limits.resetAt))

const { policies } = await card.policies()
for (const policy of policies) {
  console.log(\`\${policy.type}: \${policy.value}\`)
}`}</CodeBlock>
        </DocSubSection>

        <DocSubSection title="Sending a Transaction">
          <CodeBlock title="JavaScript">{`// Step 1: Quote the transaction (preflight check)
const quote = await card.quoteTransaction({
  to: "0x5678...abcd",
  value: "100000000000000", // wei
  description: "Payment for service",
})

if (!quote.allowed) {
  console.error("Transaction not allowed")
}

// Step 2: Execute the transaction
const result = await card.createTransaction({
  to: "0x5678...abcd",
  value: "100000000000000",
  description: "Payment for service",
})

console.log("Hash:", result.transaction.hash)
console.log("Status:", result.transaction.status)

// Optional: custom idempotency key
const result2 = await card.createTransaction(
  { to: "0x5678...abcd", value: "100000000000000" },
  { idempotencyKey: "payment_order_123" },
)`}</CodeBlock>
        </DocSubSection>

        <DocSubSection title="Pausing & Resuming">
          <CodeBlock title="JavaScript">{`// Pause the card (rejects all transactions)
await card.pause()

// Resume the card
await card.resume()`}</CodeBlock>
        </DocSubSection>

        <DocSubSection title="Error Handling">
          <CodeBlock title="JavaScript">{`import { CardApiError, CardTimeoutError, CardNetworkError } from "@sigloop/card-sdk"

try {
  await card.createTransaction({ to, value })
} catch (error) {
  if (error instanceof CardApiError) {
    // API returned an error (4xx/5xx)
    console.error(\`API Error [\${error.status}]: \${error.message}\`)
    console.error("Code:", error.code)    // e.g. "INSUFFICIENT_BALANCE"
    console.error("Details:", error.details)
  } else if (error instanceof CardTimeoutError) {
    console.error("Request timed out")
  } else if (error instanceof CardNetworkError) {
    console.error("Network error:", error.message)
  }
}`}</CodeBlock>
        </DocSubSection>

        <DocSubSection title="Request/Response Hooks">
          <CodeBlock title="JavaScript">{`const card = createCardClient({
  baseUrl: "http://localhost:8787",
  cardSecret: "sgl_...",
  beforeRequest: (ctx) => {
    console.log(\`→ \${ctx.method} \${ctx.url}\`)
  },
  afterResponse: (ctx, response) => {
    console.log(\`← \${response.status} \${ctx.path}\`)
  },
})`}</CodeBlock>
        </DocSubSection>
      </DocSection>
    </div>
  )
}
