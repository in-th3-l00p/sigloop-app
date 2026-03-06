import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { CodeBlock, DocSection, DocSubSection } from "./code-block"

export function AgentX402Docs() {
  return (
    <div className="space-y-8">
      <div>
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-bold tracking-tight">X402 Payment Protocol</h1>
          <Badge variant="outline">Automatic Payments</Badge>
        </div>
        <p className="text-muted-foreground mt-2">
          Automatic HTTP 402 payment detection and fulfillment. Agents autonomously pay for
          API calls, data access, and compute resources without developer intervention.
        </p>
      </div>

      <Separator />

      <DocSection title="How It Works">
        <p className="text-sm text-muted-foreground leading-relaxed">
          When an agent encounters an HTTP 402 (Payment Required) response from an external
          service, the X402 flow kicks in automatically:
        </p>
        <div className="space-y-2 mt-3">
          {[
            "Agent makes an HTTP request to an external service",
            "Service returns HTTP 402 with payment requirements in the response",
            "Agent detects the 402 and parses the required payment amount and recipient",
            "Agent validates the payment against card limits and policies",
            "Agent signs and submits the transaction via the Card Service",
            "Agent retries the original request after successful payment",
          ].map((step, i) => (
            <div key={i} className="flex gap-3 rounded-lg border border-border p-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-medium text-primary">
                {i + 1}
              </span>
              <p className="text-sm text-muted-foreground">{step}</p>
            </div>
          ))}
        </div>
      </DocSection>

      <DocSection title="Flow Diagram">
        <div className="rounded-lg border border-border p-4">
          <pre className="text-xs font-mono leading-relaxed overflow-x-auto">{`Agent               External Service      Card Service           Chain
  |                       |                     |                    |
  |-- GET /api/data ----->|                     |                    |
  |<-- 402 Payment Req ---|                     |                    |
  |                       |                     |                    |
  |-- POST /quote --------|-------------------->|                    |
  |<-- { allowed } -------|---------------------|                    |
  |                       |                     |                    |
  |-- POST /transactions -|-------------------->|                    |
  |                       |                     |-- submit tx ------>|
  |<-- { hash } ----------|---------------------|<-- receipt --------|
  |                       |                     |                    |
  |-- GET /api/data ----->|                     |                    |
  |   (with payment ref)  |                     |                    |
  |<-- 200 OK + data -----|                     |                    |`}</pre>
        </div>
      </DocSection>

      <DocSection title="Implementation Example">
        <CodeBlock title="JavaScript">{`import { createCardClient, CardApiError } from "@sigloop/card-sdk"

const card = createCardClient({
  baseUrl: process.env.SIGLOOP_CARD_SERVICE_URL,
  cardSecret: process.env.SIGLOOP_CARD_SECRET,
})

async function fetchWithPayment(url, options = {}) {
  const response = await fetch(url, options)

  // Not a payment-required response
  if (response.status !== 402) {
    return response
  }

  // Parse payment requirements from the 402 response
  const paymentInfo = await response.json()
  const { to, value, paymentId } = paymentInfo

  // Validate against card policies
  const quote = await card.quoteTransaction({ to, value })
  if (!quote.allowed) {
    throw new Error("Payment not allowed by card policies")
  }

  // Execute the payment
  const { transaction } = await card.createTransaction(
    { to, value, description: \`X402 payment for \${url}\` },
    { idempotencyKey: \`x402_\${paymentId}\` },
  )

  // Retry the original request with payment proof
  return fetch(url, {
    ...options,
    headers: {
      ...options.headers,
      "X-Payment-Hash": transaction.hash,
    },
  })
}`}</CodeBlock>
      </DocSection>

      <DocSection title="With Retry Logic">
        <CodeBlock title="JavaScript">{`async function fetchWithPaymentRetry(url, options = {}, maxRetries = 1) {
  let lastResponse

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    const response = await fetch(url, options)

    if (response.status !== 402) {
      return response
    }

    lastResponse = response

    try {
      const paymentInfo = await response.json()
      const { to, value, paymentId } = paymentInfo

      // Check limits before paying
      const limits = await card.limits()
      if (limits.remaining && BigInt(limits.remaining) < BigInt(value)) {
        throw new Error("Payment would exceed card limit")
      }

      const { transaction } = await card.createTransaction(
        { to, value },
        { idempotencyKey: \`x402_\${paymentId}_\${attempt}\` },
      )

      // Add payment proof to the next request
      options = {
        ...options,
        headers: {
          ...options.headers,
          "X-Payment-Hash": transaction.hash,
        },
      }
    } catch (error) {
      if (error instanceof CardApiError) {
        throw new Error(\`Payment failed: \${error.message}\`)
      }
      throw error
    }
  }

  return lastResponse
}`}</CodeBlock>
      </DocSection>

      <DocSection title="Use Cases">
        <div className="grid grid-cols-2 gap-3">
          {[
            { title: "Paid APIs", desc: "Agents automatically pay for premium API endpoints that require payment per call" },
            { title: "Data Access", desc: "Purchase access to data feeds, market data, or research reports on demand" },
            { title: "Compute Resources", desc: "Pay for GPU time, inference credits, or processing capacity" },
            { title: "Service Subscriptions", desc: "Handle micro-payments for per-use service access" },
          ].map((item) => (
            <div key={item.title} className="rounded-lg border border-border p-4 space-y-1">
              <p className="text-sm font-medium">{item.title}</p>
              <p className="text-xs text-muted-foreground">{item.desc}</p>
            </div>
          ))}
        </div>
      </DocSection>

      <DocSection title="Security Considerations">
        <div className="space-y-2">
          {[
            "Card policies act as guardrails -- allowedRecipient ensures payments only go to trusted services",
            "maxPerTx caps individual payment amounts to prevent overcharging",
            "Spending limits prevent runaway costs even if an agent encounters many 402 responses",
            "Idempotency keys (using paymentId) prevent double-payments on retries",
            "The agent should validate the 402 response format before trusting payment requirements",
          ].map((text, i) => (
            <div key={i} className="flex items-start gap-2 rounded-md bg-muted/30 px-3 py-2">
              <span className="text-xs font-medium text-primary mt-0.5">{i + 1}.</span>
              <p className="text-sm text-muted-foreground">{text}</p>
            </div>
          ))}
        </div>
      </DocSection>
    </div>
  )
}
