import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { CARD_SERVICE_BASE_URL } from "@/lib/integration-registry"
import { CodeBlock, DocSection, DocSubSection } from "./code-block"

export function CardSdkDocs() {
  return (
    <div className="space-y-8">
      <div>
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-bold tracking-tight">Card SDK</h1>
          <Badge variant="outline">@sigloop/card-sdk</Badge>
        </div>
        <p className="text-muted-foreground mt-2">
          TypeScript SDK that wraps the Card Service API. Works in Node.js, browsers, and
          edge runtimes. Zero dependencies beyond the standard Fetch API.
        </p>
      </div>

      <Separator />

      <DocSection title="Installation">
        <CodeBlock title="npm">{`npm install @sigloop/card-sdk`}</CodeBlock>
      </DocSection>

      <DocSection title="Quick Start">
        <CodeBlock title="JavaScript">{`import { createCardClient } from "@sigloop/card-sdk"

const card = createCardClient({
  baseUrl: "${CARD_SERVICE_BASE_URL}",
  cardSecret: "sgl_your_card_secret",
})

// Get card profile
const profile = await card.me()
console.log(profile.name, profile.status)

// Check balance
const { balance, spent } = await card.balance()

// Get full summary
const summary = await card.summary()`}</CodeBlock>
      </DocSection>

      <DocSection title="Constructor Options">
        <p className="text-sm text-muted-foreground mb-3">
          Pass these options to <code className="bg-muted px-1 py-0.5 rounded text-xs">createCardClient()</code> or{" "}
          <code className="bg-muted px-1 py-0.5 rounded text-xs">new CardClient()</code>.
        </p>
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
                <td className="px-3 py-2 text-xs">Card secret for auth (required for /v1/* endpoints)</td>
              </tr>
              <tr className="border-b border-border">
                <td className="px-3 py-2 font-mono text-xs">timeoutMs</td>
                <td className="px-3 py-2 text-xs">number</td>
                <td className="px-3 py-2 text-xs">15000</td>
                <td className="px-3 py-2 text-xs">Request timeout in milliseconds</td>
              </tr>
              <tr className="border-b border-border">
                <td className="px-3 py-2 font-mono text-xs">fetch</td>
                <td className="px-3 py-2 text-xs">typeof fetch</td>
                <td className="px-3 py-2 text-xs">globalThis.fetch</td>
                <td className="px-3 py-2 text-xs">Custom fetch implementation</td>
              </tr>
              <tr className="border-b border-border">
                <td className="px-3 py-2 font-mono text-xs">headers</td>
                <td className="px-3 py-2 text-xs">Record&lt;string, string&gt;</td>
                <td className="px-3 py-2 text-xs">-</td>
                <td className="px-3 py-2 text-xs">Extra headers sent with every request</td>
              </tr>
              <tr className="border-b border-border">
                <td className="px-3 py-2 font-mono text-xs">idempotencyKeyFactory</td>
                <td className="px-3 py-2 text-xs">() =&gt; string</td>
                <td className="px-3 py-2 text-xs">crypto.randomUUID</td>
                <td className="px-3 py-2 text-xs">Custom idempotency key generator</td>
              </tr>
              <tr className="border-b border-border">
                <td className="px-3 py-2 font-mono text-xs">beforeRequest</td>
                <td className="px-3 py-2 text-xs">function</td>
                <td className="px-3 py-2 text-xs">-</td>
                <td className="px-3 py-2 text-xs">Hook called before each request with RequestContext</td>
              </tr>
              <tr>
                <td className="px-3 py-2 font-mono text-xs">afterResponse</td>
                <td className="px-3 py-2 text-xs">function</td>
                <td className="px-3 py-2 text-xs">-</td>
                <td className="px-3 py-2 text-xs">Hook called after each response with RequestContext + Response</td>
              </tr>
            </tbody>
          </table>
        </div>
      </DocSection>

      <DocSection title="Methods">
        <DocSubSection title="Card Info">
          <CodeBlock title="JavaScript">{`// Card profile
const profile = await card.me()
// => { id, accountId, accountAddress, name, status, chain, createdAt }

// Live on-chain balance
const balance = await card.balance()
// => { balance, currency, chain, spent }

// Spending limits
const limits = await card.limits()
// => { limit, spent, remaining, resetPeriod, resetAt }

// Active policies
const { policies } = await card.policies()
// => [{ type: "maxPerTx", value: "100000000000000000" }, ...]

// Full snapshot (card + balance + limits + recent txs)
const summary = await card.summary()
// => { card, balance, limit, spent, recentTransactions }`}</CodeBlock>
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

        <DocSubSection title="Listing Transactions">
          <CodeBlock title="JavaScript">{`// Default (all transactions)
const { transactions } = await card.transactions()

// With limit
const { transactions: recent } = await card.transactions({ limit: 10 })`}</CodeBlock>
        </DocSubSection>

        <DocSubSection title="Quoting a Transaction">
          <CodeBlock title="JavaScript">{`// Preflight check - validates without submitting
const quote = await card.quoteTransaction({
  to: "0x5678...abcd",
  value: "100000000000000", // wei
  description: "Payment for service",
})

console.log("Allowed:", quote.allowed)
console.log("Total cost:", quote.quote.total) // amount + network fee`}</CodeBlock>
        </DocSubSection>

        <DocSubSection title="Sending a Transaction">
          <CodeBlock title="JavaScript">{`// Execute a transaction (auto-generates idempotency key)
const result = await card.createTransaction({
  to: "0x5678...abcd",
  value: "100000000000000",
  description: "Payment for service",
})

console.log("Hash:", result.transaction.hash)
console.log("Status:", result.transaction.status) // "progress" | "success" | "error"
console.log("Replayed:", result.idempotentReplay)  // true if duplicate key

// Custom idempotency key (ensures at-most-once execution)
const result2 = await card.createTransaction(
  { to: "0x5678...abcd", value: "100000000000000" },
  { idempotencyKey: "payment_order_123" },
)`}</CodeBlock>
        </DocSubSection>

        <DocSubSection title="Pausing & Resuming">
          <CodeBlock title="JavaScript">{`// Pause the card (rejects all transactions)
await card.pause()   // => { status: "paused" }

// Resume the card
await card.resume()  // => { status: "active" }`}</CodeBlock>
        </DocSubSection>

        <DocSubSection title="Health Check">
          <CodeBlock title="JavaScript">{`// No authentication required
const health = await card.health()
// => { ok: true, service: "card-service" }

// OpenAPI schema
const spec = await card.openApi()`}</CodeBlock>
        </DocSubSection>
      </DocSection>

      <DocSection title="Error Handling">
        <p className="text-sm text-muted-foreground mb-3">
          The SDK throws typed errors for different failure scenarios.
        </p>
        <CodeBlock title="JavaScript">{`import {
  CardApiError,
  CardTimeoutError,
  CardNetworkError,
} from "@sigloop/card-sdk"

try {
  await card.createTransaction({ to, value })
} catch (error) {
  if (error instanceof CardApiError) {
    // API returned an error response (4xx/5xx)
    console.error(\`[\${error.status}] \${error.message}\`)
    console.error("Code:", error.code)      // e.g. "INSUFFICIENT_BALANCE"
    console.error("Details:", error.details) // raw response body
  } else if (error instanceof CardTimeoutError) {
    // Request exceeded timeoutMs
    console.error("Request timed out")
  } else if (error instanceof CardNetworkError) {
    // Network-level failure (DNS, connection refused, etc.)
    console.error("Network error:", error.message)
  }
}`}</CodeBlock>
        <div className="rounded-lg border border-border overflow-hidden mt-3">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="px-3 py-2 text-left font-medium">Error Class</th>
                <th className="px-3 py-2 text-left font-medium">Properties</th>
                <th className="px-3 py-2 text-left font-medium">When</th>
              </tr>
            </thead>
            <tbody className="text-muted-foreground">
              <tr className="border-b border-border">
                <td className="px-3 py-2 font-mono text-xs">CardApiError</td>
                <td className="px-3 py-2 text-xs">status, code, details</td>
                <td className="px-3 py-2 text-xs">API returns 4xx/5xx</td>
              </tr>
              <tr className="border-b border-border">
                <td className="px-3 py-2 font-mono text-xs">CardTimeoutError</td>
                <td className="px-3 py-2 text-xs">message</td>
                <td className="px-3 py-2 text-xs">Request exceeds timeout</td>
              </tr>
              <tr>
                <td className="px-3 py-2 font-mono text-xs">CardNetworkError</td>
                <td className="px-3 py-2 text-xs">message</td>
                <td className="px-3 py-2 text-xs">Network-level failure</td>
              </tr>
            </tbody>
          </table>
        </div>
      </DocSection>

      <DocSection title="Request/Response Hooks">
        <p className="text-sm text-muted-foreground mb-3">
          Use hooks for logging, metrics, or custom header injection.
        </p>
        <CodeBlock title="JavaScript">{`const card = createCardClient({
  baseUrl: "${CARD_SERVICE_BASE_URL}",
  cardSecret: "sgl_...",
  beforeRequest: (ctx) => {
    // ctx: { path, method, url, headers }
    console.log(\`-> \${ctx.method} \${ctx.url}\`)
  },
  afterResponse: (ctx, response) => {
    console.log(\`<- \${response.status} \${ctx.path}\`)
  },
})`}</CodeBlock>
      </DocSection>

      <DocSection title="TypeScript Types">
        <p className="text-sm text-muted-foreground mb-3">
          All types are exported from the package.
        </p>
        <CodeBlock title="TypeScript">{`import type {
  CardClientOptions,
  CardProfile,
  CardBalance,
  CardLimits,
  CardPolicy,
  CardSummary,
  CardTransaction,
  CreateTransactionInput,
  CreateTransactionOptions,
  ListTransactionsQuery,
  QuoteTransactionInput,
  QuoteTransactionResponse,
  RequestContext,
} from "@sigloop/card-sdk"`}</CodeBlock>
      </DocSection>
    </div>
  )
}
