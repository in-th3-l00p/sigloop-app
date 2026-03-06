import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { CodeBlock, DocSection, DocSubSection } from "./code-block"

export function AgentElizaosDocs() {
  return (
    <div className="space-y-8">
      <div>
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-bold tracking-tight">ElizaOS Integration</h1>
          <Badge variant="outline">@sigloop/eliza-card-plugin</Badge>
        </div>
        <p className="text-muted-foreground mt-2">
          Plugin for ElizaOS agents that registers Sigloop card actions as native plugin hooks.
        </p>
      </div>

      <Separator />

      <DocSection title="Installation">
        <CodeBlock title="npm">{`npm i @sigloop/eliza-card-plugin`}</CodeBlock>
      </DocSection>

      <DocSection title="Environment Variables">
        <CodeBlock title=".env">{`SIGLOOP_CARD_SECRET=sgl_your_card_secret
SIGLOOP_CARD_SERVICE_URL=http://localhost:8787`}</CodeBlock>
      </DocSection>

      <DocSection title="Usage">
        <CodeBlock title="JavaScript">{`import { sigloopCardPlugin } from "@sigloop/eliza-card-plugin"

agent.use(sigloopCardPlugin({
  cardSecret: process.env.SIGLOOP_CARD_SECRET,
  baseUrl: process.env.SIGLOOP_CARD_SERVICE_URL,
}))`}</CodeBlock>
      </DocSection>

      <DocSection title="Full Example">
        <CodeBlock title="ElizaOS agent with Sigloop">{`import { createAgent } from "elizaos"
import { sigloopCardPlugin } from "@sigloop/eliza-card-plugin"

const agent = createAgent({
  name: "Payment Agent",
  description: "An agent that can make on-chain payments",
})

// Register the Sigloop plugin
agent.use(sigloopCardPlugin({
  cardSecret: process.env.SIGLOOP_CARD_SECRET,
  baseUrl: process.env.SIGLOOP_CARD_SERVICE_URL,
}))

// The agent now has access to card actions:
// - Check balance and limits
// - Quote transactions
// - Execute payments
// - View transaction history

await agent.start()`}</CodeBlock>
      </DocSection>

      <DocSection title="Plugin Actions">
        <p className="text-sm text-muted-foreground mb-3">
          The plugin registers these actions in your ElizaOS agent:
        </p>
        <div className="space-y-2">
          {[
            { action: "Get card info", desc: "Retrieve card profile, balance, and current spending limits" },
            { action: "Check policies", desc: "Read active policy rules before making spending decisions" },
            { action: "Quote payment", desc: "Preflight check a transaction amount against policies and balance" },
            { action: "Send payment", desc: "Execute an on-chain transaction with automatic idempotency" },
            { action: "View history", desc: "List recent transactions made through the card" },
          ].map((item) => (
            <div key={item.action} className="rounded-lg border border-border p-3 space-y-1">
              <p className="text-sm font-medium">{item.action}</p>
              <p className="text-xs text-muted-foreground">{item.desc}</p>
            </div>
          ))}
        </div>
      </DocSection>

      <DocSection title="Dashboard Setup">
        <p className="text-sm text-muted-foreground">
          To register an ElizaOS integration from the dashboard:
        </p>
        <div className="space-y-2 mt-3">
          {[
            "Navigate to your card's Integrations section",
            "Add a new integration and select ElizaOS Plugin",
            "Configure the agent purpose, task scope, and behavioral rules",
            "Copy the environment variables and install command",
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
