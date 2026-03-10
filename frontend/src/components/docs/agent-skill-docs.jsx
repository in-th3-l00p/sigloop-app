import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { CARD_SERVICE_BASE_URL } from "@/lib/integration-registry"
import { CodeBlock, DocSection, DocSubSection } from "./code-block"

export function AgentSkillDocs() {
  return (
    <div className="space-y-8">
      <div>
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-bold tracking-tight">Skill Packages</h1>
          <Badge variant="outline">Codex, Claude, OpenClaw</Badge>
        </div>
        <p className="text-muted-foreground mt-2">
          Pre-built skill bundles that give agents structured context about their card:
          identity, spending limits, policies, and the operational flow for making payments.
        </p>
      </div>

      <Separator />

      <DocSection title="Overview">
        <p className="text-sm text-muted-foreground leading-relaxed">
          Skills are generated with card-specific context and downloaded as ZIP bundles
          from the dashboard. They include prompt instructions, manifests, and your
          custom configuration (purpose, scope, behavior rules, escalation policy).
        </p>
        <div className="grid grid-cols-3 gap-3 mt-3">
          <div className="rounded-lg border border-border p-3 space-y-1">
            <p className="text-sm font-medium">Codex Skill</p>
            <p className="text-xs text-muted-foreground">Skill package for OpenAI Codex agents</p>
          </div>
          <div className="rounded-lg border border-border p-3 space-y-1">
            <p className="text-sm font-medium">Claude Skill</p>
            <p className="text-xs text-muted-foreground">Skill bundle for Claude-oriented workflows</p>
          </div>
          <div className="rounded-lg border border-border p-3 space-y-1">
            <p className="text-sm font-medium">OpenClaw Skill</p>
            <p className="text-xs text-muted-foreground">Skill bundle for OpenClaw agent framework</p>
          </div>
        </div>
      </DocSection>

      <DocSection title="How to Install">
        <div className="space-y-2">
          {[
            { step: "1", text: "Navigate to your card in the dashboard" },
            { step: "2", text: "Open Integrations and choose Codex, Claude, or OpenClaw skill" },
            { step: "3", text: "Configure agent purpose, task scope, behavioral rules, and escalation policy" },
            { step: "4", text: "Click \"Download Skill Bundle\" to get the generated ZIP" },
            { step: "5", text: "Load prompt/manifest files into your agent platform" },
          ].map((item) => (
            <div key={item.step} className="flex gap-3 rounded-lg border border-border p-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-medium text-primary">
                {item.step}
              </span>
              <p className="text-sm text-muted-foreground">{item.text}</p>
            </div>
          ))}
        </div>
      </DocSection>

      <DocSection title="Artifact Structure">
        <p className="text-sm text-muted-foreground mb-3">The generated bundle contains everything the agent needs:</p>
        <CodeBlock title="Skill artifact">{`{
  "kind": "sigloop-agent-skill",
  "schemaVersion": 1,
  "platform": "codex",
  "generatedAt": "2026-03-06T12:00:00.000Z",
  "integration": {
    "name": "Codex Skill",
    "description": "Sigloop card actions for Codex agents",
    "type": "skill"
  },
  "cardContext": {
    "name": "Trading Agent",
    "status": "active",
    "chain": "sepolia",
    "accountAddress": "0x1234...abcd",
    "limit": "500000000000000000",
    "spent": "0",
    "policies": [
      { "type": "maxPerTx", "value": "100000000000000000" }
    ],
    "agentPurpose": "DeFi trading",
    "taskScope": "Only swap tokens on Uniswap",
    "behavioralRules": "Never exceed 0.1 ETH per tx",
    "escalationPolicy": "Pause if 3 failures in 1 hour"
  },
  "providedAgentInfo": [
    "Card name: Trading Agent",
    "Card status: active",
    "Chain: sepolia",
    "Spending limit (wei): 500000000000000000",
    "Policies: maxPerTx=100000000000000000"
  ],
  "instructions": [
    "You are an agent with controlled wallet access through a Sigloop card.",
    "Always read constraints first before sending transactions.",
    "Use GET /v1/card/limits and GET /v1/card/policies before spend decisions.",
    "For payments, call POST /v1/card/transactions/quote, then POST /v1/card/transactions.",
    "Attach x-card-secret for every call.",
    "For POST /v1/card/transactions, include idempotency-key header.",
    "Never expose the card secret in logs or public responses."
  ],
  "api": {
    "auth": { "header": "x-card-secret", "value": "sgl_..." },
    "baseUrl": "${CARD_SERVICE_BASE_URL}",
    "endpoints": [
      { "method": "GET",  "path": "/v1/card/me",                 "purpose": "Profile" },
      { "method": "GET",  "path": "/v1/card/balance",            "purpose": "Live balance" },
      { "method": "GET",  "path": "/v1/card/limits",             "purpose": "Limit and remaining" },
      { "method": "GET",  "path": "/v1/card/policies",           "purpose": "Policy rules" },
      { "method": "GET",  "path": "/v1/card/summary",            "purpose": "Snapshot state" },
      { "method": "GET",  "path": "/v1/card/transactions",       "purpose": "History" },
      { "method": "POST", "path": "/v1/card/transactions/quote", "purpose": "Preflight" },
      { "method": "POST", "path": "/v1/card/transactions",       "purpose": "Execute transfer" }
    ]
  }
}`}</CodeBlock>
      </DocSection>

      <DocSection title="What the Agent Receives">
        <p className="text-sm text-muted-foreground mb-3">
          The skill artifact tells the agent:
        </p>
        <div className="space-y-2">
          {[
            "Card identity: name, status, account address, chain",
            "Spending context: limit, spent amount, and active card policies",
            "Secure tool auth: x-card-secret header for Card Service API calls",
            "Operational flow: check limits/policies, quote, then execute transaction",
            "Your customization: purpose, scope, behavior rules, escalation policy",
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
