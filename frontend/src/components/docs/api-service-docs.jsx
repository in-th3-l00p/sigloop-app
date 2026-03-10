import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { API_SERVICE_BASE_URL } from "@/lib/integration-registry"
import { CodeBlock, DocSection, DocSubSection, EndpointBlock } from "./code-block"

export function ApiServiceDocs() {
  return (
    <div className="space-y-8">
      <div>
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-bold tracking-tight">API Service Reference</h1>
          <Badge variant="outline">v0.2.0</Badge>
        </div>
        <p className="text-muted-foreground mt-2">
          Full-featured REST API for managing accounts, cards, transactions, integrations,
          and contacts. Authenticated via API keys with scope-based access control.
        </p>
      </div>

      <Separator />

      <DocSection title="Base URL">
        <CodeBlock>{`${API_SERVICE_BASE_URL}`}</CodeBlock>
        <p className="text-xs text-muted-foreground mt-2">
          Set via <code className="bg-muted px-1 py-0.5 rounded">VITE_API_SERVICE_URL</code> environment variable.
        </p>
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
  "presetId": "langchain-library",
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
    </div>
  )
}
