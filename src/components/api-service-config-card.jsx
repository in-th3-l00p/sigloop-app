import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export function ApiServiceConfigCard({ baseUrl, setBaseUrl, apiKey, setApiKey, onConnect, isConnecting }) {
  return (
    <div className="rounded-lg border border-border p-4 space-y-3">
      <h2 className="text-sm font-medium text-muted-foreground">API Service Connection</h2>
      <div className="space-y-2">
        <Label htmlFor="api-service-base-url">Base URL</Label>
        <Input
          id="api-service-base-url"
          value={baseUrl}
          onChange={(event) => setBaseUrl(event.target.value)}
          placeholder="http://localhost:8788"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="api-service-key">API Key</Label>
        <Input
          id="api-service-key"
          value={apiKey}
          onChange={(event) => setApiKey(event.target.value)}
          placeholder="sgapi_..."
          className="font-mono text-xs"
        />
      </div>
      {onConnect && (
        <Button onClick={onConnect} disabled={isConnecting} className="cursor-pointer">
          {isConnecting ? "Connecting..." : "Connect"}
        </Button>
      )}
    </div>
  )
}
