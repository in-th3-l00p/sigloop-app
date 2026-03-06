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
  |                          |                         |
  |-- GET /v1/card/limits -->|                         |
  |<-- limits, policies ----|                         |
  |                          |                         |
  |-- POST /quote ---------->| validate policies       |
  |<-- { allowed: true } ---|                         |
  |                          |                         |
  |-- POST /transactions --->| enforce limits -------->|
  |                          | check balance           |-- ZeroDev Kernel
  |<-- { hash, status } ----|<-- tx receipt -----------|
  |                          |                         |`}</pre>
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

      <DocSection title="Integration Methods">
        <p className="text-sm text-muted-foreground">
          Choose the integration method that fits your agent framework. Use the sidebar
          to explore each one in detail.
        </p>
        <div className="grid grid-cols-2 gap-3 mt-3">
          {[
            { title: "Skill Packages", desc: "Pre-built skill bundles for Codex and OpenClaw agents with card context." },
            { title: "LangChain", desc: "JS and Python helper libraries that create native LangChain tool sets." },
            { title: "ElizaOS", desc: "Plugin for ElizaOS agents with card action hooks." },
            { title: "Direct API", desc: "Use the Card Service REST API directly from any HTTP client." },
            { title: "Card SDK", desc: "TypeScript SDK with typed methods for all card operations." },
            { title: "X402 Protocol", desc: "Automatic HTTP 402 payment detection and fulfillment." },
          ].map((item) => (
            <div key={item.title} className="rounded-lg border border-border p-4 space-y-1">
              <p className="text-sm font-medium">{item.title}</p>
              <p className="text-xs text-muted-foreground">{item.desc}</p>
            </div>
          ))}
        </div>
      </DocSection>

      <DocSection title="Recommended Agent Flow">
        <p className="text-sm text-muted-foreground mb-3">
          Regardless of integration method, follow this operational pattern:
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
    </div>
  )
}
