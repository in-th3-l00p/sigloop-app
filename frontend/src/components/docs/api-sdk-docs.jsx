import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { CodeBlock, DocSection, DocSubSection } from "./code-block"

export function ApiSdkDocs() {
  return (
    <div className="space-y-8">
      <div>
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-bold tracking-tight">API SDK</h1>
          <Badge variant="outline">@sigloop/api-sdk</Badge>
        </div>
        <p className="text-muted-foreground mt-2">
          TypeScript SDK for the API Service. Provides typed methods for every endpoint
          with built-in error handling, timeouts, and idempotency key generation.
        </p>
      </div>

      <Separator />

      <DocSection title="Installation">
        <CodeBlock title="npm">{`npm install @sigloop/api-sdk`}</CodeBlock>
      </DocSection>

      <DocSection title="Quick Start">
        <CodeBlock title="JavaScript">{`import { createApiClient } from "@sigloop/api-sdk"

const api = createApiClient({
  baseUrl: "http://localhost:8080/api/api-service",
  apiKey: "your_api_key",
})

// Check authentication
const auth = await api.me()
console.log(auth.keyName, auth.scopes)

// List accounts
const { accounts } = await api.listAccounts()`}</CodeBlock>
      </DocSection>

      <DocSection title="Constructor Options">
        <p className="text-sm text-muted-foreground mb-3">
          Pass these options to <code className="bg-muted px-1 py-0.5 rounded text-xs">createApiClient()</code> or{" "}
          <code className="bg-muted px-1 py-0.5 rounded text-xs">new ApiClient()</code>.
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
                <td className="px-3 py-2 text-xs">API Service URL</td>
              </tr>
              <tr className="border-b border-border">
                <td className="px-3 py-2 font-mono text-xs">apiKey</td>
                <td className="px-3 py-2 text-xs">string</td>
                <td className="px-3 py-2 text-xs">-</td>
                <td className="px-3 py-2 text-xs">API key for authentication (required for /v1/* endpoints)</td>
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
        <DocSubSection title="Managing Accounts">
          <CodeBlock title="JavaScript">{`// List accounts
const { accounts } = await api.listAccounts()

// Provision a new smart account (creates on-chain via ZeroDev)
const { account } = await api.provisionAccount({
  name: "Agent Wallet",
  chain: "sepolia",
  icon: "bot",
})
console.log("Address:", account.address)

// Import an existing account
const { account: imported } = await api.createAccount({
  name: "Imported",
  chain: "sepolia",
  icon: "wallet",
  address: "0x1234...abcd",
  privateKey: "0xprivkey...",
})

// Update account
await api.updateAccount(account._id, { name: "Renamed" })

// Get account details
const { account: details } = await api.getAccount(account._id)

// Remove account
await api.removeAccount(account._id)`}</CodeBlock>
        </DocSubSection>

        <DocSubSection title="Managing Cards">
          <CodeBlock title="JavaScript">{`// List cards for an account
const { cards } = await api.listAccountCards(accountId)

// Create a card
const { card } = await api.createCard({
  accountId: "acc_123",
  name: "Trading Agent",
  secret: "sgl_my_unique_secret",
  limit: "500000000000000000",       // 0.5 ETH in wei
  limitResetPeriod: "daily",
  policies: [
    { type: "maxPerTx", value: "100000000000000000" },  // 0.1 ETH
    { type: "allowedRecipient", value: "0xabcd...1234" },
  ],
})

// Update a card
await api.updateCard(card._id, {
  limit: "1000000000000000000",
  status: "paused",
  policies: [{ type: "maxPerTx", value: "200000000000000000" }],
})

// Get card details
const { card: details } = await api.getCard(card._id)

// List card transactions
const { transactions } = await api.listCardTransactions(card._id)

// Delete a card
await api.removeCard(card._id)`}</CodeBlock>
        </DocSubSection>

        <DocSubSection title="Sending Transactions">
          <CodeBlock title="JavaScript">{`// Send a transaction from an account
const { transaction } = await api.sendTransaction(
  accountId,
  {
    to: "0x5678...abcd",
    value: "100000000000000",  // wei
  },
)

console.log("Hash:", transaction.hash)
console.log("Status:", transaction.status) // "progress" | "success" | "error"

// Custom idempotency key
const { transaction: tx2 } = await api.sendTransaction(
  accountId,
  { to: "0x5678...abcd", value: "100000000000000" },
  { idempotencyKey: "order_12345" },
)

// List account transactions
const { transactions } = await api.listAccountTransactions(accountId)`}</CodeBlock>
        </DocSubSection>

        <DocSubSection title="Managing Integrations">
          <CodeBlock title="JavaScript">{`// List integrations for a card
const { integrations } = await api.listCardIntegrations(cardId)

// Create an integration
const { integration } = await api.createIntegration({
  cardId: "card_123",
  presetId: "langchain-library",
  type: "library",
  platform: "langchain",
  name: "LangChain JS",
  description: "LangChain JS helper library",
  schemaVersion: 1,
  config: {
    language: "javascript",
    agentPurpose: "DeFi trading",
    taskScope: "Only swap tokens",
  },
})

// Update integration config
await api.updateIntegration(integration._id, {
  config: { agentPurpose: "Updated purpose" },
})

// Remove integration
await api.removeIntegration(integration._id)`}</CodeBlock>
        </DocSubSection>

        <DocSubSection title="Managing API Keys">
          <CodeBlock title="JavaScript">{`// List API keys (requires admin scope)
const { apiKeys } = await api.listApiKeys()

// Create a new API key
const { apiKey } = await api.createApiKey({
  name: "CI/CD Key",
  scopes: ["read", "write"],
  ipAllowlist: ["203.0.113.0"],
  rateLimitPerMinute: 120,
})
// IMPORTANT: apiKey.apiKey contains the full key, shown only once

// Update key policy
await api.updateApiKeyPolicy(apiKey._id, {
  scopes: ["read"],
  rateLimitPerMinute: 60,
})

// Revoke a key (permanent)
await api.revokeApiKey(apiKey._id)`}</CodeBlock>
        </DocSubSection>

        <DocSubSection title="Managing Contacts">
          <CodeBlock title="JavaScript">{`// List contacts
const { contacts } = await api.listContacts()

// Create a contact
const { contact } = await api.createContact({
  name: "Alice",
  address: "0x5678...abcd",
})

// Remove a contact
await api.removeContact(contact._id)`}</CodeBlock>
        </DocSubSection>
      </DocSection>

      <DocSection title="Error Handling">
        <p className="text-sm text-muted-foreground mb-3">
          The SDK throws typed errors for different failure scenarios.
        </p>
        <CodeBlock title="JavaScript">{`import {
  ApiApiError,
  ApiTimeoutError,
  ApiNetworkError,
} from "@sigloop/api-sdk"

try {
  await api.sendTransaction(accountId, { to, value })
} catch (error) {
  if (error instanceof ApiApiError) {
    console.error(\`[\${error.status}] \${error.message}\`)
    console.error("Code:", error.code)
    // Common codes:
    // - MISSING_API_KEY
    // - MISSING_IDEMPOTENCY_KEY
    // - IDEMPOTENCY_KEY_CONFLICT
    // - NOT_FOUND
  } else if (error instanceof ApiTimeoutError) {
    console.error("Request timed out")
  } else if (error instanceof ApiNetworkError) {
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
                <td className="px-3 py-2 font-mono text-xs">ApiApiError</td>
                <td className="px-3 py-2 text-xs">status, code, details</td>
                <td className="px-3 py-2 text-xs">API returns 4xx/5xx</td>
              </tr>
              <tr className="border-b border-border">
                <td className="px-3 py-2 font-mono text-xs">ApiTimeoutError</td>
                <td className="px-3 py-2 text-xs">message</td>
                <td className="px-3 py-2 text-xs">Request exceeds timeout</td>
              </tr>
              <tr>
                <td className="px-3 py-2 font-mono text-xs">ApiNetworkError</td>
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
        <CodeBlock title="JavaScript">{`const api = createApiClient({
  baseUrl: "http://localhost:8080/api/api-service",
  apiKey: "your_key",
  beforeRequest: (ctx) => {
    // ctx: { path, method, url, headers }
    console.log(\`-> \${ctx.method} \${ctx.url}\`)
  },
  afterResponse: (ctx, response) => {
    console.log(\`<- \${response.status} \${ctx.path}\`)
  },
})`}</CodeBlock>
      </DocSection>

      <DocSection title="Full Workflow Example">
        <p className="text-sm text-muted-foreground mb-3">
          End-to-end setup: provision an account, create a card with policies, attach an integration.
        </p>
        <CodeBlock title="JavaScript">{`import { createApiClient } from "@sigloop/api-sdk"

const api = createApiClient({
  baseUrl: "http://localhost:8080/api/api-service",
  apiKey: process.env.SIGLOOP_API_KEY,
})

// 1. Provision a smart account
const { account } = await api.provisionAccount({
  name: "Agent Wallet",
  chain: "sepolia",
})

// 2. Create a card with policies
const { card } = await api.createCard({
  accountId: account._id,
  name: "Payment Agent",
  secret: "sgl_" + crypto.randomUUID(),
  limit: "1000000000000000000",  // 1 ETH
  limitResetPeriod: "weekly",
  policies: [
    { type: "maxPerTx", value: "100000000000000000" },
  ],
})

// 3. Attach an integration
const { integration } = await api.createIntegration({
  cardId: card._id,
  presetId: "langchain-library",
  type: "library",
  platform: "langchain",
  name: "LangChain Agent",
  description: "Payment agent for API services",
  schemaVersion: 1,
  config: {
    language: "javascript",
    agentPurpose: "Pay for external API calls",
    taskScope: "HTTP 402 payment handling",
    behavioralRules: "Never exceed 0.05 ETH per payment",
    escalationPolicy: "Pause card if 3 failures in 1 hour",
  },
})

// 4. Fund the account, then use card.secret with Card SDK
console.log("Card secret:", card.secret)
console.log("Account address:", account.address)`}</CodeBlock>
      </DocSection>

      <DocSection title="TypeScript Types">
        <p className="text-sm text-muted-foreground mb-3">
          All types are exported from the package.
        </p>
        <CodeBlock title="TypeScript">{`import type {
  ApiClientOptions,
  ApiAuthContext,
  ApiKey,
  SmartAccount,
  Transaction,
  Card,
  CardPolicy,
  Integration,
  IntegrationConfig,
  Contact,
  CreateApiKeyInput,
  UpdateApiKeyPolicyInput,
  CreateAccountInput,
  ProvisionAccountInput,
  UpdateAccountInput,
  SendTransactionInput,
  SendTransactionOptions,
  CreateCardInput,
  UpdateCardInput,
  CreateIntegrationInput,
  UpdateIntegrationInput,
  CreateContactInput,
  RequestContext,
} from "@sigloop/api-sdk"`}</CodeBlock>
      </DocSection>
    </div>
  )
}
