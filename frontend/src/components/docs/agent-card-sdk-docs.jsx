import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { CodeBlock, DocSection, DocSubSection } from "./code-block"

export function AgentCardSdkDocs() {
  return (
    <div className="space-y-8">
      <div>
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-bold tracking-tight">Card SDK in Agents</h1>
          <Badge variant="outline">@sigloop/card-sdk</Badge>
        </div>
        <p className="text-muted-foreground mt-2">
          Use the TypeScript Card SDK directly inside your agent code for typed, ergonomic
          access to all card operations with built-in error handling.
        </p>
      </div>

      <Separator />

      <DocSection title="Installation">
        <CodeBlock title="npm">{`npm install @sigloop/card-sdk`}</CodeBlock>
      </DocSection>

      <DocSection title="Setup">
        <CodeBlock title="JavaScript">{`import { createCardClient } from "@sigloop/card-sdk"

const card = createCardClient({
  baseUrl: process.env.SIGLOOP_CARD_SERVICE_URL,
  cardSecret: process.env.SIGLOOP_CARD_SECRET,
})`}</CodeBlock>
      </DocSection>

      <DocSection title="Full Agent Payment Flow">
        <p className="text-sm text-muted-foreground mb-3">
          The recommended pattern for agent payments: check limits, quote, execute.
        </p>
        <CodeBlock title="JavaScript">{`import { createCardClient, CardApiError } from "@sigloop/card-sdk"

const card = createCardClient({
  baseUrl: process.env.SIGLOOP_CARD_SERVICE_URL,
  cardSecret: process.env.SIGLOOP_CARD_SECRET,
})

async function makePayment(to, valueWei, description) {
  // 1. Check limits
  const limits = await card.limits()
  if (limits.remaining && BigInt(limits.remaining) < BigInt(valueWei)) {
    return { ok: false, reason: "Exceeds remaining limit" }
  }

  // 2. Quote (preflight check)
  const quote = await card.quoteTransaction({ to, value: valueWei, description })
  if (!quote.allowed) {
    return { ok: false, reason: "Transaction not allowed by policies" }
  }

  // 3. Execute
  try {
    const { transaction } = await card.createTransaction(
      { to, value: valueWei, description },
      { idempotencyKey: \`pay_\${Date.now()}\` },
    )
    return { ok: true, hash: transaction.hash, status: transaction.status }
  } catch (error) {
    if (error instanceof CardApiError) {
      return { ok: false, reason: error.message, code: error.code }
    }
    throw error
  }
}`}</CodeBlock>
      </DocSection>

      <DocSection title="Checking State Before Spending">
        <CodeBlock title="JavaScript">{`// Get everything at once
const summary = await card.summary()
console.log("Balance:", summary.balance)
console.log("Limit:", summary.limit)
console.log("Spent:", summary.spent)
console.log("Recent txs:", summary.recentTransactions.length)

// Or check individually
const limits = await card.limits()
console.log("Remaining:", limits.remaining)
console.log("Resets at:", new Date(limits.resetAt))

const { policies } = await card.policies()
for (const policy of policies) {
  console.log(\`\${policy.type}: \${policy.value}\`)
}`}</CodeBlock>
      </DocSection>

      <DocSection title="Error Handling in Agents">
        <p className="text-sm text-muted-foreground mb-3">
          Agents should handle errors gracefully rather than crashing:
        </p>
        <CodeBlock title="JavaScript">{`import { CardApiError, CardTimeoutError, CardNetworkError } from "@sigloop/card-sdk"

async function safePayment(to, value) {
  try {
    const { transaction } = await card.createTransaction({ to, value })
    return { ok: true, hash: transaction.hash }
  } catch (error) {
    if (error instanceof CardApiError) {
      switch (error.code) {
        case "INSUFFICIENT_BALANCE":
          return { ok: false, reason: "Not enough balance", retry: false }
        case "POLICY_VIOLATION":
          return { ok: false, reason: "Blocked by policy", retry: false }
        case "CARD_PAUSED":
          return { ok: false, reason: "Card is paused", retry: false }
        default:
          return { ok: false, reason: error.message, retry: error.status >= 500 }
      }
    }
    if (error instanceof CardTimeoutError) {
      return { ok: false, reason: "Request timed out", retry: true }
    }
    if (error instanceof CardNetworkError) {
      return { ok: false, reason: "Network error", retry: true }
    }
    throw error
  }
}`}</CodeBlock>
      </DocSection>

      <DocSection title="Emergency Controls">
        <p className="text-sm text-muted-foreground mb-3">
          Agents can self-pause their card in response to anomalies:
        </p>
        <CodeBlock title="JavaScript">{`let failureCount = 0

async function monitoredPayment(to, value) {
  const result = await safePayment(to, value)

  if (!result.ok) {
    failureCount++
    if (failureCount >= 3) {
      console.error("Too many failures, pausing card")
      await card.pause()
      return { ok: false, reason: "Card self-paused after 3 failures" }
    }
  } else {
    failureCount = 0
  }

  return result
}`}</CodeBlock>
      </DocSection>

      <DocSection title="Why Use the SDK vs Direct API">
        <div className="space-y-2">
          {[
            { pro: "Type safety", desc: "Full TypeScript types for all inputs and responses" },
            { pro: "Auto idempotency", desc: "Generates unique idempotency keys automatically" },
            { pro: "Typed errors", desc: "Catch CardApiError, CardTimeoutError, CardNetworkError separately" },
            { pro: "Request hooks", desc: "Add logging or metrics via beforeRequest/afterResponse" },
            { pro: "Configurable timeout", desc: "Set per-client or per-request timeouts" },
          ].map((item) => (
            <div key={item.pro} className="rounded-lg border border-border p-3 space-y-1">
              <p className="text-sm font-medium">{item.pro}</p>
              <p className="text-xs text-muted-foreground">{item.desc}</p>
            </div>
          ))}
        </div>
      </DocSection>
    </div>
  )
}
