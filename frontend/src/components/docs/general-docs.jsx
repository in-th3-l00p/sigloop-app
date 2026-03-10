import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { API_SERVICE_BASE_URL, CARD_SERVICE_BASE_URL } from "@/lib/service-urls"
import { CodeBlock, DocSection, DocSubSection } from "./code-block"

export function GeneralDocs() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Sigloop Documentation</h1>
        <p className="text-muted-foreground mt-2">
          Wallet infrastructure for AI agents. Create smart accounts, issue scoped agent cards,
          and let your agents make autonomous on-chain payments with budget guardrails.
        </p>
      </div>

      <Separator />

      <DocSection title="Overview">
        <p className="text-sm text-muted-foreground leading-relaxed">
          Sigloop combines ERC-4337 account abstraction with agentic payment automation.
          It provides a dashboard for managing smart accounts and agent cards, two backend
          services (Card Service and API Service), and TypeScript SDKs for programmatic access.
        </p>
        <div className="grid grid-cols-2 gap-3 mt-4">
          {[
            { title: "Smart Accounts", desc: "ERC-4337 kernel accounts provisioned via ZeroDev. Each account has a unique on-chain address." },
            { title: "Agent Cards", desc: "Scoped spending permissions attached to an account. Each card has its own secret, limit, and policies." },
            { title: "Integrations", desc: "Connect cards via Skill bundles (Codex/Claude/OpenClaw), LangChain (JS/Python), or Direct API." },
            { title: "API Keys", desc: "Scope-based keys (read, write, tx, admin) with rate limits and IP allowlists." },
          ].map((item) => (
            <div key={item.title} className="rounded-lg border border-border p-4 space-y-1">
              <p className="text-sm font-medium">{item.title}</p>
              <p className="text-xs text-muted-foreground">{item.desc}</p>
            </div>
          ))}
        </div>
      </DocSection>

      <DocSection title="Architecture">
        <div className="rounded-lg border border-border p-4 space-y-3">
          <pre className="text-xs font-mono leading-relaxed overflow-x-auto">{`+---------------+     +----------------+     +--------------+
|   Dashboard   |---->|   Convex (DB)  |<----|  API Service  |
|   (React)     |     |  + Privy Auth  |     |  (Hono:8788)  |
+---------------+     +----------------+     +--------------+
                             |                      |
                      +-------------+         +-----------+
                      | Card Service|         |  ZeroDev  |
                      | (Hono:8787) |---------| Kernel    |
                      +-------------+         +-----------+
                             |
                      +-------------+
                      |  AI Agents  |
                      |  (via card  |
                      |   secret)   |
                      +-------------+`}</pre>
        </div>
      </DocSection>

      <DocSection title="Authentication">
        <DocSubSection title="Dashboard (Privy)">
          <p className="text-sm text-muted-foreground">
            Users authenticate via Privy using email or wallet. Privy issues a JWT that
            Convex validates for all database operations.
          </p>
        </DocSubSection>
        <DocSubSection title="Card Service (x-card-secret)">
          <p className="text-sm text-muted-foreground">
            Each agent card has a unique secret. Agents authenticate by passing the
            secret in the <code className="text-xs bg-muted px-1 py-0.5 rounded">x-card-secret</code> header.
            This scopes the agent to only that card's balance, limits, and policies.
          </p>
          <CodeBlock title="Card Service Auth">{`curl -H "x-card-secret: sgl_your_card_secret" \\
  ${CARD_SERVICE_BASE_URL}/v1/card/me`}</CodeBlock>
        </DocSubSection>
        <DocSubSection title="API Service (x-api-key)">
          <p className="text-sm text-muted-foreground">
            API keys are created from the dashboard with specific scopes. Pass the key
            in the <code className="text-xs bg-muted px-1 py-0.5 rounded">x-api-key</code> header.
          </p>
          <CodeBlock title="API Service Auth">{`curl -H "x-api-key: your_api_key" \\
  ${API_SERVICE_BASE_URL}/v1/accounts`}</CodeBlock>
        </DocSubSection>
      </DocSection>

      <DocSection title="Core Concepts">
        <DocSubSection title="Session Keys & Scoped Permissions">
          <p className="text-sm text-muted-foreground">
            Agent cards act as session keys: time-bound, contract-scoped permissions
            that can be revoked instantly. Each card enforces spending limits, allowed
            contracts, maximum per-transaction amounts, and allowed recipients.
          </p>
        </DocSubSection>
        <DocSubSection title="Budget Guardrails">
          <p className="text-sm text-muted-foreground">
            Per-card spending limits with automatic reset periods (daily, weekly, monthly).
            Policies are enforced on every transaction before it reaches the chain.
          </p>
          <div className="space-y-2 mt-2">
            {[
              { type: "allowedContract", desc: "Restricts transactions to specific contract addresses" },
              { type: "maxPerTx", desc: "Maximum wei value for a single transaction" },
              { type: "allowedRecipient", desc: "Whitelist of recipient addresses" },
            ].map((policy) => (
              <div key={policy.type} className="flex items-start gap-2 text-sm">
                <Badge variant="secondary" className="text-xs shrink-0 mt-0.5">{policy.type}</Badge>
                <span className="text-muted-foreground">{policy.desc}</span>
              </div>
            ))}
          </div>
        </DocSubSection>
        <DocSubSection title="Idempotency">
          <p className="text-sm text-muted-foreground">
            All transaction endpoints require an <code className="text-xs bg-muted px-1 py-0.5 rounded">idempotency-key</code> header.
            If a request is retried with the same key, the original result is returned without
            re-executing the transaction. The SDKs auto-generate idempotency keys by default.
          </p>
        </DocSubSection>
        <DocSubSection title="Transaction Finality">
          <p className="text-sm text-muted-foreground">
            Transactions are submitted via ZeroDev Kernel (ERC-4337 bundler). They initially
            return with <Badge variant="secondary" className="text-xs">progress</Badge> status,
            then background tracking updates to <Badge variant="secondary" className="text-xs">success</Badge> or{" "}
            <Badge variant="secondary" className="text-xs">error</Badge> once finality is confirmed.
          </p>
        </DocSubSection>
      </DocSection>

      <DocSection title="Supported Chains">
        <div className="flex gap-2">
          <Badge variant="outline">Sepolia (testnet)</Badge>
          <Badge variant="outline">Base Sepolia (testnet)</Badge>
        </div>
        <p className="text-xs text-muted-foreground mt-2">
          Mainnet support coming soon. All values are in wei (1 ETH = 10^18 wei).
        </p>
      </DocSection>

      <DocSection title="Quick Start">
        <div className="space-y-4">
          <DocSubSection title="1. Create a Smart Account">
            <p className="text-sm text-muted-foreground">
              From the dashboard, click "Create Account" to provision a new ERC-4337 kernel
              account on your chosen chain.
            </p>
          </DocSubSection>
          <DocSubSection title="2. Issue an Agent Card">
            <p className="text-sm text-muted-foreground">
              Navigate to your account, then create a card with a name, secret, spending limit,
              and policies. The secret is shown once -- save it securely.
            </p>
          </DocSubSection>
          <DocSubSection title="3. Connect Your Agent">
            <p className="text-sm text-muted-foreground">
              Add an integration to your card (Skill package, LangChain, or Direct API).
              Use the card secret to authenticate your agent against the Card Service.
            </p>
          </DocSubSection>
          <DocSubSection title="4. Programmatic Access">
            <p className="text-sm text-muted-foreground">
              For full control, create an API key from the API dashboard and use the API SDK
              to manage accounts, cards, transactions, and integrations programmatically.
            </p>
          </DocSubSection>
        </div>
      </DocSection>
    </div>
  )
}
