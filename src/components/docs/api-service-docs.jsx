import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { CodeBlock, DocSection, DocSubSection, EndpointBlock } from "./code-block"

export function ApiServiceDocs() {
  return (
    <div className="space-y-8">
      <div>
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-bold tracking-tight">API Service & SDK</h1>
          <Badge variant="outline">v0.2.0</Badge>
        </div>
        <p className="text-muted-foreground mt-2">
          Full-featured REST API for managing accounts, cards, transactions, integrations,
          and contacts. Authenticated via API keys with scope-based access control.
        </p>
      </div>

      <Separator />

      <DocSection title="Base URL">
        <CodeBlock>{`http://localhost:8788`}</CodeBlock>
      </DocSection>

      <DocSection title="Authentication">
        <p className="text-sm text-muted-foreground">
          All <code className="bg-muted px-1 py-0.5 rounded text-xs">/v1/*</code> endpoints
          require the <code className="bg-muted px-1 py-0.5 rounded text-xs">x-api-key</code> header.
          API keys are created from the dashboard with specific scopes.
        </p>
        <CodeBlock title="Request Header">{`x-api-key: your_api_key_here`}</CodeBlock>

        <DocSubSection title="Scopes">
          <div className="rounded-lg border border-border overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="px-3 py-2 text-left font-medium">Scope</th>
                  <th className="px-3 py-2 text-left font-medium">Permissions</th>
                </tr>
              </thead>
              <tbody className="text-muted-foreground">
                <tr className="border-b border-border">
                  <td className="px-3 py-2"><Badge variant="secondary" className="text-xs">read</Badge></td>
                  <td className="px-3 py-2 text-xs">List and read accounts, cards, transactions, contacts, integrations</td>
                </tr>
                <tr className="border-b border-border">
                  <td className="px-3 py-2"><Badge variant="secondary" className="text-xs">write</Badge></td>
                  <td className="px-3 py-2 text-xs">Create, update, and delete accounts, cards, contacts, integrations</td>
                </tr>
                <tr className="border-b border-border">
                  <td className="px-3 py-2"><Badge variant="secondary" className="text-xs">tx</Badge></td>
                  <td className="px-3 py-2 text-xs">Send transactions, provision new smart accounts</td>
                </tr>
                <tr>
                  <td className="px-3 py-2"><Badge variant="secondary" className="text-xs">admin</Badge></td>
                  <td className="px-3 py-2 text-xs">Manage API keys (create, update, revoke, list)</td>
                </tr>
              </tbody>
            </table>
          </div>
        </DocSubSection>

        <DocSubSection title="Security Features">
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-lg border border-border p-3 space-y-1">
              <p className="text-sm font-medium">IP Allowlist</p>
              <p className="text-xs text-muted-foreground">Restrict API key usage to specific IP addresses</p>
            </div>
            <div className="rounded-lg border border-border p-3 space-y-1">
              <p className="text-sm font-medium">Rate Limiting</p>
              <p className="text-xs text-muted-foreground">Per-key rate limit (1-10,000 requests/min)</p>
            </div>
            <div className="rounded-lg border border-border p-3 space-y-1">
              <p className="text-sm font-medium">Request Logging</p>
              <p className="text-xs text-muted-foreground">Every request is logged with method, path, status, duration, and IP</p>
            </div>
            <div className="rounded-lg border border-border p-3 space-y-1">
              <p className="text-sm font-medium">Idempotency</p>
              <p className="text-xs text-muted-foreground">Transaction endpoints require idempotency-key header</p>
            </div>
          </div>
        </DocSubSection>
      </DocSection>

      <DocSection title="API Endpoints">
        <DocSubSection title="Identity">
          <EndpointBlock
            method="GET"
            path="/v1/me"
            scope="read"
            description="Returns the authenticated API key context: key ID, user ID, name, scopes, and rate limit."
            response={`{
  "ok": true,
  "apiKeyId": "key_123",
  "userId": "user_456",
  "keyName": "Production Key",
  "keyPrefix": "sk_prod_",
  "scopes": ["read", "write", "tx"],
  "ipAllowlist": [],
  "rateLimitPerMinute": 60
}`}
          />
        </DocSubSection>

        <DocSubSection title="API Keys">
          <div className="space-y-3">
            <EndpointBlock
              method="GET"
              path="/v1/api-keys"
              scope="admin"
              description="List all API keys for the authenticated user."
            />
            <EndpointBlock
              method="POST"
              path="/v1/api-keys"
              scope="admin"
              description="Create a new API key. The full key is returned only once in the response."
              body={`{
  "name": "My Agent Key",
  "scopes": ["read", "write", "tx"],
  "ipAllowlist": ["203.0.113.0"],
  "rateLimitPerMinute": 120
}`}
            />
            <EndpointBlock
              method="PATCH"
              path="/v1/api-keys/:apiKeyId"
              scope="admin"
              description="Update an API key's name, scopes, IP allowlist, or rate limit."
              body={`{
  "name": "Updated Name",
  "scopes": ["read"],
  "rateLimitPerMinute": 60
}`}
            />
            <EndpointBlock
              method="DELETE"
              path="/v1/api-keys/:apiKeyId"
              scope="admin"
              description="Revoke an API key. This is permanent."
            />
          </div>
        </DocSubSection>

        <DocSubSection title="Accounts">
          <div className="space-y-3">
            <EndpointBlock
              method="GET"
              path="/v1/accounts"
              scope="read"
              description="List all smart accounts."
              response={`{
  "accounts": [
    {
      "_id": "acc_123",
      "name": "Main Wallet",
      "chain": "sepolia",
      "icon": "wallet",
      "address": "0x1234...abcd",
      "status": "active",
      "createdAt": 1709683200000
    }
  ]
}`}
            />
            <EndpointBlock
              method="POST"
              path="/v1/accounts"
              scope="write"
              description="Create an account with an existing address and private key."
              body={`{
  "name": "Imported Wallet",
  "chain": "sepolia",
  "icon": "wallet",
  "address": "0x1234...abcd",
  "privateKey": "0xabcd..."
}`}
            />
            <EndpointBlock
              method="POST"
              path="/v1/accounts/provision"
              scope="tx"
              description="Provision a new ERC-4337 Kernel smart account on-chain. ZeroDev generates the address and private key."
              body={`{
  "name": "New Agent Wallet",
  "chain": "sepolia",
  "icon": "bot"
}`}
            />
            <EndpointBlock
              method="GET"
              path="/v1/accounts/:accountId"
              scope="read"
              description="Get a specific account by ID."
            />
            <EndpointBlock
              method="PATCH"
              path="/v1/accounts/:accountId"
              scope="write"
              description="Update account name or icon."
              body={`{ "name": "Renamed Wallet", "icon": "shield" }`}
            />
            <EndpointBlock
              method="DELETE"
              path="/v1/accounts/:accountId"
              scope="write"
              description="Remove an account."
            />
          </div>
        </DocSubSection>

        <DocSubSection title="Transactions">
          <div className="space-y-3">
            <EndpointBlock
              method="GET"
              path="/v1/accounts/:accountId/transactions"
              scope="read"
              description="List all transactions for an account."
            />
            <EndpointBlock
              method="POST"
              path="/v1/accounts/:accountId/transactions"
              scope="tx"
              description="Send a transaction from an account via ZeroDev Kernel. Requires idempotency-key header."
              body={`{
  "to": "0x5678...abcd",
  "value": "100000000000000"
}

Header: idempotency-key: unique_key_per_intent`}
              response={`{
  "transaction": {
    "_id": "tx_123",
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

        <DocSubSection title="Cards">
          <div className="space-y-3">
            <EndpointBlock
              method="GET"
              path="/v1/accounts/:accountId/cards"
              scope="read"
              description="List all cards for an account."
            />
            <EndpointBlock
              method="POST"
              path="/v1/cards"
              scope="write"
              description="Create a new agent card attached to an account."
              body={`{
  "accountId": "acc_123",
  "name": "Trading Agent",
  "secret": "sgl_unique_secret",
  "limit": "500000000000000000",
  "limitResetPeriod": "daily",
  "policies": [
    { "type": "maxPerTx", "value": "100000000000000000" },
    { "type": "allowedRecipient", "value": "0xabcd...1234" }
  ]
}`}
            />
            <EndpointBlock
              method="GET"
              path="/v1/cards/:cardId"
              scope="read"
              description="Get a specific card."
            />
            <EndpointBlock
              method="PATCH"
              path="/v1/cards/:cardId"
              scope="write"
              description="Update a card's name, limit, status, reset period, or policies."
              body={`{
  "name": "Updated Agent",
  "limit": "1000000000000000000",
  "status": "paused",
  "policies": [{ "type": "maxPerTx", "value": "200000000000000000" }]
}`}
            />
            <EndpointBlock
              method="DELETE"
              path="/v1/cards/:cardId"
              scope="write"
              description="Delete a card."
            />
            <EndpointBlock
              method="GET"
              path="/v1/cards/:cardId/transactions"
              scope="read"
              description="List transactions made through a specific card."
            />
            <EndpointBlock
              method="GET"
              path="/v1/cards/:cardId/integrations"
              scope="read"
              description="List integrations attached to a card."
            />
          </div>
        </DocSubSection>

        <DocSubSection title="Integrations">
          <div className="space-y-3">
            <EndpointBlock
              method="POST"
              path="/v1/integrations"
              scope="write"
              description="Create a new integration for a card."
              body={`{
  "cardId": "card_123",
  "presetId": "langchain-library-js",
  "type": "library",
  "platform": "langchain",
  "name": "LangChain JS",
  "description": "LangChain JS helper library",
  "schemaVersion": 1,
  "config": {
    "language": "javascript",
    "agentPurpose": "DeFi trading"
  }
}`}
            />
            <EndpointBlock
              method="PATCH"
              path="/v1/integrations/:integrationId"
              scope="write"
              description="Update integration configuration."
              body={`{ "config": { "agentPurpose": "Updated purpose" } }`}
            />
            <EndpointBlock
              method="DELETE"
              path="/v1/integrations/:integrationId"
              scope="write"
              description="Remove an integration."
            />
          </div>
        </DocSubSection>

        <DocSubSection title="Contacts">
          <div className="space-y-3">
            <EndpointBlock
              method="GET"
              path="/v1/contacts"
              scope="read"
              description="List saved contacts (address book)."
            />
            <EndpointBlock
              method="POST"
              path="/v1/contacts"
              scope="write"
              description="Create a contact."
              body={`{ "name": "Alice", "address": "0x5678...abcd" }`}
            />
            <EndpointBlock
              method="DELETE"
              path="/v1/contacts/:contactId"
              scope="write"
              description="Remove a contact."
            />
          </div>
        </DocSubSection>
      </DocSection>

      <Separator />

      <DocSection title="API SDK (@sigloop/api-sdk)">
        <p className="text-sm text-muted-foreground">
          TypeScript SDK for the API Service. Provides typed methods for every endpoint
          with built-in error handling, timeouts, and idempotency key generation.
        </p>

        <DocSubSection title="Installation">
          <CodeBlock title="npm">{`npm install @sigloop/api-sdk`}</CodeBlock>
        </DocSubSection>

        <DocSubSection title="Quick Start">
          <CodeBlock title="JavaScript">{`import { createApiClient } from "@sigloop/api-sdk"

const api = createApiClient({
  baseUrl: "http://localhost:8788",
  apiKey: "your_api_key",
})

// Check authentication
const auth = await api.me()
console.log(auth.keyName, auth.scopes)

// List accounts
const { accounts } = await api.listAccounts()`}</CodeBlock>
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
                  <td className="px-3 py-2 text-xs">API Service URL</td>
                </tr>
                <tr className="border-b border-border">
                  <td className="px-3 py-2 font-mono text-xs">apiKey</td>
                  <td className="px-3 py-2 text-xs">string</td>
                  <td className="px-3 py-2 text-xs">-</td>
                  <td className="px-3 py-2 text-xs">API key for authentication</td>
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

        <DocSubSection title="Managing Accounts">
          <CodeBlock title="JavaScript">{`// List accounts
const { accounts } = await api.listAccounts()

// Provision a new smart account (creates on-chain)
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
  presetId: "langchain-library-js",
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

        <DocSubSection title="Error Handling">
          <CodeBlock title="JavaScript">{`import { ApiApiError, ApiTimeoutError, ApiNetworkError } from "@sigloop/api-sdk"

try {
  await api.sendTransaction(accountId, { to, value })
} catch (error) {
  if (error instanceof ApiApiError) {
    console.error(\`API Error [\${error.status}]: \${error.message}\`)
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
        </DocSubSection>

        <DocSubSection title="Request/Response Hooks">
          <CodeBlock title="JavaScript">{`const api = createApiClient({
  baseUrl: "http://localhost:8788",
  apiKey: "your_key",
  beforeRequest: (ctx) => {
    console.log(\`→ \${ctx.method} \${ctx.url}\`)
  },
  afterResponse: (ctx, response) => {
    console.log(\`← \${response.status} \${ctx.path}\`)
  },
})`}</CodeBlock>
        </DocSubSection>

        <DocSubSection title="Full Workflow Example">
          <CodeBlock title="End-to-end: account, card, agent setup">{`import { createApiClient } from "@sigloop/api-sdk"

const api = createApiClient({
  baseUrl: "http://localhost:8788",
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
  presetId: "langchain-library-js",
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
        </DocSubSection>
      </DocSection>
    </div>
  )
}
