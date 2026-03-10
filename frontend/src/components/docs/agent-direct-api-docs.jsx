import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { CARD_SERVICE_BASE_URL } from "@/lib/service-urls"
import { CodeBlock, DocSection, DocSubSection } from "./code-block"

export function AgentDirectApiDocs() {
  return (
    <div className="space-y-8">
      <div>
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-bold tracking-tight">Direct API Integration</h1>
          <Badge variant="outline">Any HTTP Client</Badge>
        </div>
        <p className="text-muted-foreground mt-2">
          Use the Card Service REST API directly from any agent framework, language, or HTTP
          client. Set the card secret in the request header and call the endpoints.
        </p>
      </div>

      <Separator />

      <DocSection title="Environment Variables">
        <CodeBlock title=".env">{`SIGLOOP_CARD_SECRET=sgl_your_card_secret
SIGLOOP_CARD_SERVICE_URL=${CARD_SERVICE_BASE_URL}`}</CodeBlock>
      </DocSection>

      <DocSection title="Authentication">
        <p className="text-sm text-muted-foreground">
          Pass the card secret in the <code className="bg-muted px-1 py-0.5 rounded text-xs">x-card-secret</code> header
          on every request to <code className="bg-muted px-1 py-0.5 rounded text-xs">/v1/card/*</code> endpoints.
        </p>
        <CodeBlock title="Header">{`x-card-secret: sgl_your_card_secret`}</CodeBlock>
      </DocSection>

      <DocSection title="curl Examples">
        <DocSubSection title="Get Card Summary">
          <CodeBlock title="bash">{`curl -s $SIGLOOP_CARD_SERVICE_URL/v1/card/summary \\
  -H "x-card-secret: $SIGLOOP_CARD_SECRET"`}</CodeBlock>
        </DocSubSection>

        <DocSubSection title="Check Limits">
          <CodeBlock title="bash">{`curl -s $SIGLOOP_CARD_SERVICE_URL/v1/card/limits \\
  -H "x-card-secret: $SIGLOOP_CARD_SECRET"`}</CodeBlock>
        </DocSubSection>

        <DocSubSection title="Check Policies">
          <CodeBlock title="bash">{`curl -s $SIGLOOP_CARD_SERVICE_URL/v1/card/policies \\
  -H "x-card-secret: $SIGLOOP_CARD_SECRET"`}</CodeBlock>
        </DocSubSection>

        <DocSubSection title="Quote a Transaction">
          <CodeBlock title="bash">{`curl -s $SIGLOOP_CARD_SERVICE_URL/v1/card/transactions/quote \\
  -H "x-card-secret: $SIGLOOP_CARD_SECRET" \\
  -H "Content-Type: application/json" \\
  -d '{
    "to": "0x5678...abcd",
    "value": "100000000000000",
    "description": "Payment for API call"
  }'`}</CodeBlock>
        </DocSubSection>

        <DocSubSection title="Execute a Transaction">
          <CodeBlock title="bash">{`curl -s $SIGLOOP_CARD_SERVICE_URL/v1/card/transactions \\
  -H "x-card-secret: $SIGLOOP_CARD_SECRET" \\
  -H "Content-Type: application/json" \\
  -H "idempotency-key: unique_key_123" \\
  -d '{
    "to": "0x5678...abcd",
    "value": "100000000000000",
    "description": "Payment for API call"
  }'`}</CodeBlock>
        </DocSubSection>

        <DocSubSection title="List Transactions">
          <CodeBlock title="bash">{`curl -s "$SIGLOOP_CARD_SERVICE_URL/v1/card/transactions?limit=10" \\
  -H "x-card-secret: $SIGLOOP_CARD_SECRET"`}</CodeBlock>
        </DocSubSection>

        <DocSubSection title="Pause / Resume Card">
          <CodeBlock title="bash">{`# Pause
curl -s -X POST $SIGLOOP_CARD_SERVICE_URL/v1/card/pause \\
  -H "x-card-secret: $SIGLOOP_CARD_SECRET"

# Resume
curl -s -X POST $SIGLOOP_CARD_SERVICE_URL/v1/card/resume \\
  -H "x-card-secret: $SIGLOOP_CARD_SECRET"`}</CodeBlock>
        </DocSubSection>
      </DocSection>

      <DocSection title="Python Example">
        <CodeBlock title="Python (requests)">{`import os
import requests

BASE_URL = os.environ["SIGLOOP_CARD_SERVICE_URL"]
HEADERS = {
    "x-card-secret": os.environ["SIGLOOP_CARD_SECRET"],
    "Content-Type": "application/json",
}

# Check limits
limits = requests.get(f"{BASE_URL}/v1/card/limits", headers=HEADERS).json()
print(f"Remaining: {limits['remaining']}")

# Quote
quote = requests.post(
    f"{BASE_URL}/v1/card/transactions/quote",
    headers=HEADERS,
    json={"to": "0x5678...abcd", "value": "100000000000000"},
).json()

if quote["allowed"]:
    # Execute
    result = requests.post(
        f"{BASE_URL}/v1/card/transactions",
        headers={**HEADERS, "idempotency-key": "unique_key_123"},
        json={"to": "0x5678...abcd", "value": "100000000000000"},
    ).json()
    print(f"Hash: {result['transaction']['hash']}")`}</CodeBlock>
      </DocSection>

      <DocSection title="Available Endpoints">
        <div className="rounded-lg border border-border overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="px-3 py-2 text-left font-medium">Method</th>
                <th className="px-3 py-2 text-left font-medium">Path</th>
                <th className="px-3 py-2 text-left font-medium">Description</th>
              </tr>
            </thead>
            <tbody className="text-muted-foreground">
              {[
                { method: "GET", path: "/v1/card/me", desc: "Card profile" },
                { method: "GET", path: "/v1/card/balance", desc: "Live on-chain balance" },
                { method: "GET", path: "/v1/card/limits", desc: "Spend limits and reset window" },
                { method: "GET", path: "/v1/card/policies", desc: "Policy rules" },
                { method: "GET", path: "/v1/card/summary", desc: "Full card snapshot" },
                { method: "GET", path: "/v1/card/transactions", desc: "Transaction history" },
                { method: "POST", path: "/v1/card/transactions/quote", desc: "Preflight check" },
                { method: "POST", path: "/v1/card/transactions", desc: "Execute transaction" },
                { method: "POST", path: "/v1/card/pause", desc: "Pause card" },
                { method: "POST", path: "/v1/card/resume", desc: "Resume card" },
              ].map((row) => (
                <tr key={`${row.method}-${row.path}`} className="border-b border-border last:border-0">
                  <td className="px-3 py-2 text-xs font-medium">{row.method}</td>
                  <td className="px-3 py-2 font-mono text-xs">{row.path}</td>
                  <td className="px-3 py-2 text-xs">{row.desc}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </DocSection>
    </div>
  )
}
