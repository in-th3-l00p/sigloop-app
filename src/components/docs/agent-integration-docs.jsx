import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { CodeBlock, DocSection, DocSubSection } from "./code-block"

export function AgentIntegrationDocs() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">AI Agent Integration</h1>
        <p className="text-muted-foreground mt-2">
          Connect any AI agent framework to Sigloop cards for autonomous, policy-controlled
          on-chain payments. Agents authenticate with a card secret and operate within
          configurable guardrails.
        </p>
      </div>

      <Separator />

      <DocSection title="How It Works">
        <p className="text-sm text-muted-foreground leading-relaxed">
          Each agent card acts as a scoped session key. When an agent connects to a card,
          it gets access to the card's balance through the Card Service API. Every transaction
          is validated against the card's policies and spending limits before being submitted
          to the chain.
        </p>
        <div className="rounded-lg border border-border p-4 mt-3">
          <pre className="text-xs leading-relaxed overflow-x-auto">{`Agent                    Card Service               Chain
  │                          │                         │
  │── GET /v1/card/limits ──▶│                         │
  │◀── limits, policies ────│                         │
  │                          │                         │
  │── POST /quote ──────────▶│ validate policies       │
  │◀── { allowed: true } ───│                         │
  │                          │                         │
  │── POST /transactions ───▶│ enforce limits ────────▶│
  │                          │ check balance           │── ZeroDev Kernel
  │◀── { hash, status } ────│◀── tx receipt ──────────│
  │                          │                         │`}</pre>
        </div>
      </DocSection>

      <DocSection title="Card-Agent Security Model">
        <div className="space-y-3">
          <div className="rounded-lg border border-border p-4 space-y-2">
            <p className="text-sm font-medium">Isolation</p>
            <p className="text-sm text-muted-foreground">
              Each card has a unique secret. An agent with card secret A cannot access card B's
              balance or transactions. Cards are bound to a single smart account.
            </p>
          </div>
          <div className="rounded-lg border border-border p-4 space-y-2">
            <p className="text-sm font-medium">Spending Limits</p>
            <p className="text-sm text-muted-foreground">
              Cards have configurable spending limits with reset periods (daily, weekly, monthly).
              The card tracks cumulative spend and rejects transactions that would exceed the limit.
            </p>
          </div>
          <div className="rounded-lg border border-border p-4 space-y-2">
            <p className="text-sm font-medium">Policy Enforcement</p>
            <p className="text-sm text-muted-foreground">
              Policies are checked before every transaction. Multiple policies can be combined:
            </p>
            <div className="space-y-1 mt-1">
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="text-xs">allowedContract</Badge>
                <span className="text-xs text-muted-foreground">Only send to specific contract addresses</span>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="text-xs">maxPerTx</Badge>
                <span className="text-xs text-muted-foreground">Cap the maximum value per transaction</span>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="text-xs">allowedRecipient</Badge>
                <span className="text-xs text-muted-foreground">Whitelist specific recipient addresses</span>
              </div>
            </div>
          </div>
          <div className="rounded-lg border border-border p-4 space-y-2">
            <p className="text-sm font-medium">Instant Revocation</p>
            <p className="text-sm text-muted-foreground">
              Cards can be paused or deleted at any time from the dashboard or API.
              A paused card immediately rejects all transaction requests.
            </p>
          </div>
        </div>
      </DocSection>

      <DocSection title="Integration Types">
        <DocSubSection title="Skill Packages">
          <p className="text-sm text-muted-foreground">
            Pre-built skill bundles that give agents structured context about their card:
            identity, spending limits, policies, and the operational flow for making payments.
            Available for Codex and OpenClaw platforms.
          </p>
          <p className="text-sm text-muted-foreground mt-2">
            Skills are generated with card-specific context and downloaded as JSON artifacts.
            They include instructions, tool references, and your custom agent configuration
            (purpose, scope, behavior rules, escalation policy).
          </p>
          <CodeBlock title="Skill artifact structure">{`{
  "kind": "sigloop-agent-skill",
  "schemaVersion": 1,
  "platform": "codex",
  "cardContext": {
    "name": "Trading Agent",
    "status": "active",
    "chain": "sepolia",
    "limit": "500000000000000000",
    "policies": [{ "type": "maxPerTx", "value": "100000000000000000" }]
  },
  "instructions": [
    "Always read constraints first before sending transactions.",
    "Use GET /v1/card/limits and GET /v1/card/policies before spend decisions.",
    "For payments, call POST /v1/card/transactions/quote, then POST /v1/card/transactions.",
    "Attach x-card-secret for every call."
  ],
  "api": {
    "auth": { "header": "x-card-secret", "value": "sgl_..." },
    "baseUrl": "http://localhost:8787",
    "endpoints": [...]
  }
}`}</CodeBlock>
        </DocSubSection>

        <DocSubSection title="Library Integrations">
          <p className="text-sm text-muted-foreground mb-4">
            Helper libraries that wrap the Card Service API into tool sets native to
            each agent framework. Install, configure environment variables, and use.
          </p>

          <div className="space-y-4">
            <div className="rounded-lg border border-border p-4 space-y-3">
              <div className="flex items-center gap-2">
                <p className="text-sm font-medium">LangChain JS</p>
                <Badge variant="outline" className="text-xs">@sigloop/langchain-card</Badge>
              </div>
              <CodeBlock title="Setup">{`npm i @sigloop/langchain-card`}</CodeBlock>
              <CodeBlock title="Usage">{`import { createSigloopCardToolset } from "@sigloop/langchain-card"

const tools = createSigloopCardToolset({
  cardSecret: process.env.SIGLOOP_CARD_SECRET,
  baseUrl: process.env.SIGLOOP_CARD_SERVICE_URL,
})

// Pass tools to your LangChain agent
const agent = createReactAgent({ llm, tools })`}</CodeBlock>
            </div>

            <div className="rounded-lg border border-border p-4 space-y-3">
              <div className="flex items-center gap-2">
                <p className="text-sm font-medium">LangChain Python</p>
                <Badge variant="outline" className="text-xs">sigloop-langchain-card</Badge>
              </div>
              <CodeBlock title="Setup">{`pip install sigloop-langchain-card`}</CodeBlock>
              <CodeBlock title="Usage">{`from sigloop_langchain import create_sigloop_card_tools

tools = create_sigloop_card_tools(
    card_secret=os.environ["SIGLOOP_CARD_SECRET"],
    base_url=os.environ["SIGLOOP_CARD_SERVICE_URL"],
)

# Pass tools to your LangChain agent
agent = create_react_agent(llm=llm, tools=tools)`}</CodeBlock>
            </div>

            <div className="rounded-lg border border-border p-4 space-y-3">
              <div className="flex items-center gap-2">
                <p className="text-sm font-medium">ElizaOS Plugin</p>
                <Badge variant="outline" className="text-xs">@sigloop/eliza-card-plugin</Badge>
              </div>
              <CodeBlock title="Setup">{`npm i @sigloop/eliza-card-plugin`}</CodeBlock>
              <CodeBlock title="Usage">{`import { sigloopCardPlugin } from "@sigloop/eliza-card-plugin"

agent.use(sigloopCardPlugin({
  cardSecret: process.env.SIGLOOP_CARD_SECRET,
  baseUrl: process.env.SIGLOOP_CARD_SERVICE_URL,
}))`}</CodeBlock>
            </div>
          </div>
        </DocSubSection>

        <DocSubSection title="Direct API Integration">
          <p className="text-sm text-muted-foreground">
            For custom agent frameworks or any HTTP client, use the Card Service API directly.
            Set the card secret in the <code className="bg-muted px-1 py-0.5 rounded text-xs">x-card-secret</code> header.
          </p>
          <CodeBlock title="Environment Variables">{`SIGLOOP_CARD_SECRET=sgl_your_card_secret
SIGLOOP_CARD_SERVICE_URL=http://localhost:8787`}</CodeBlock>
          <CodeBlock title="curl">{`# Get card summary
curl -s $SIGLOOP_CARD_SERVICE_URL/v1/card/summary \\
  -H "x-card-secret: $SIGLOOP_CARD_SECRET"

# Quote a transaction
curl -s $SIGLOOP_CARD_SERVICE_URL/v1/card/transactions/quote \\
  -H "x-card-secret: $SIGLOOP_CARD_SECRET" \\
  -H "Content-Type: application/json" \\
  -d '{"to":"0x5678...","value":"100000000000000"}'

# Execute a transaction
curl -s $SIGLOOP_CARD_SERVICE_URL/v1/card/transactions \\
  -H "x-card-secret: $SIGLOOP_CARD_SECRET" \\
  -H "Content-Type: application/json" \\
  -H "idempotency-key: unique_key_123" \\
  -d '{"to":"0x5678...","value":"100000000000000"}'`}</CodeBlock>
        </DocSubSection>
      </DocSection>

      <DocSection title="Recommended Agent Flow">
        <p className="text-sm text-muted-foreground mb-3">
          When building an agent that uses a Sigloop card, follow this operational pattern:
        </p>
        <div className="space-y-2">
          {[
            { step: "1", title: "Read constraints first", desc: "Call GET /v1/card/limits and GET /v1/card/policies to understand current spending capacity and rules." },
            { step: "2", title: "Quote before executing", desc: "Call POST /v1/card/transactions/quote to validate the transaction against policies and balance without submitting." },
            { step: "3", title: "Execute with idempotency", desc: "Call POST /v1/card/transactions with a unique idempotency-key per payment intent." },
            { step: "4", title: "Verify after sending", desc: "Check GET /v1/card/transactions or GET /v1/card/summary to confirm the transaction status." },
            { step: "5", title: "Never expose secrets", desc: "Keep the card secret out of logs, public responses, and agent output." },
          ].map((item) => (
            <div key={item.step} className="flex gap-3 rounded-lg border border-border p-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-medium text-primary">
                {item.step}
              </span>
              <div>
                <p className="text-sm font-medium">{item.title}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </DocSection>

      <DocSection title="Integration Configuration">
        <p className="text-sm text-muted-foreground">
          When creating an integration from the dashboard, you can customize agent behavior
          with these configuration fields:
        </p>
        <div className="rounded-lg border border-border overflow-hidden mt-3">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="px-3 py-2 text-left font-medium">Field</th>
                <th className="px-3 py-2 text-left font-medium">Description</th>
              </tr>
            </thead>
            <tbody className="text-muted-foreground">
              <tr className="border-b border-border">
                <td className="px-3 py-2 font-mono text-xs">agentPurpose</td>
                <td className="px-3 py-2 text-xs">The primary purpose of this agent (e.g., "DeFi trading", "Service payments")</td>
              </tr>
              <tr className="border-b border-border">
                <td className="px-3 py-2 font-mono text-xs">taskScope</td>
                <td className="px-3 py-2 text-xs">Boundaries of what the agent should do (e.g., "Only swap tokens on Uniswap")</td>
              </tr>
              <tr className="border-b border-border">
                <td className="px-3 py-2 font-mono text-xs">behavioralRules</td>
                <td className="px-3 py-2 text-xs">Rules the agent must follow (e.g., "Never send more than 0.1 ETH at once")</td>
              </tr>
              <tr>
                <td className="px-3 py-2 font-mono text-xs">escalationPolicy</td>
                <td className="px-3 py-2 text-xs">What to do when uncertain (e.g., "Pause and notify owner if tx value > 0.5 ETH")</td>
              </tr>
            </tbody>
          </table>
        </div>
      </DocSection>

      <DocSection title="Using the Card SDK in Agents">
        <p className="text-sm text-muted-foreground mb-3">
          For TypeScript/JavaScript agents, the Card SDK provides a clean interface:
        </p>
        <CodeBlock title="Full agent payment flow">{`import { createCardClient, CardApiError } from "@sigloop/card-sdk"

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

  // 2. Quote
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

      <DocSection title="X402 Payment Protocol">
        <p className="text-sm text-muted-foreground">
          Sigloop supports the X402 payment automation pattern. When an agent encounters
          an HTTP 402 (Payment Required) response from an external service, it can
          automatically:
        </p>
        <div className="space-y-2 mt-3">
          {[
            "Detect the 402 response and parse payment requirements",
            "Validate the payment amount against card limits and policies",
            "Sign and submit the transaction via the Card Service",
            "Retry the original request after successful payment",
          ].map((step, i) => (
            <div key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
              <span className="text-xs font-medium text-primary mt-0.5">{i + 1}.</span>
              {step}
            </div>
          ))}
        </div>
        <p className="text-xs text-muted-foreground mt-3">
          This enables agents to autonomously pay for API calls, data access, and compute
          resources without developer intervention for each payment.
        </p>
      </DocSection>
    </div>
  )
}
