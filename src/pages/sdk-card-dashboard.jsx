import { useCallback, useEffect, useMemo, useState } from "react"
import { Link, Navigate, useParams } from "react-router-dom"
import { usePrivy } from "@privy-io/react-auth"
import { useConvexAuth } from "convex/react"
import { ArrowLeft, Pause, Play, Plus, Trash2 } from "lucide-react"
import { ThemeToggle } from "@/components/theme-toggle"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ApiServiceConfigCard } from "@/components/api-service-config-card"
import { useApiServiceClient } from "@/hooks/use-api-service-client"
import { formatEthFull, truncateAddress } from "@/lib/format"

export default function SdkCardDashboardPage() {
  const { accountId, cardId } = useParams()
  const { logout } = usePrivy()
  const { isLoading: authLoading, isAuthenticated } = useConvexAuth()
  const { client, baseUrl, setBaseUrl, apiKey, setApiKey, isConfigured } = useApiServiceClient()

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [card, setCard] = useState(null)
  const [transactions, setTransactions] = useState([])
  const [integrations, setIntegrations] = useState([])

  const [integrationName, setIntegrationName] = useState("")
  const [integrationDescription, setIntegrationDescription] = useState("")
  const [creatingIntegration, setCreatingIntegration] = useState(false)

  const loadCardData = useCallback(async () => {
    if (!isConfigured || !cardId) return
    setLoading(true)
    setError("")
    try {
      const [cardResult, txResult, integrationsResult] = await Promise.all([
        client.getCard(cardId),
        client.listCardTransactions(cardId),
        client.listCardIntegrations(cardId),
      ])
      setCard(cardResult.card)
      setTransactions(txResult.transactions ?? [])
      setIntegrations(integrationsResult.integrations ?? [])
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load card data")
    } finally {
      setLoading(false)
    }
  }, [client, isConfigured, cardId])

  useEffect(() => {
    void loadCardData()
  }, [loadCardData])

  const sortedTransactions = useMemo(
    () => [...transactions].sort((a, b) => (b.createdAt ?? 0) - (a.createdAt ?? 0)),
    [transactions],
  )

  const togglePause = async () => {
    if (!cardId || !card) return
    setError("")
    try {
      await client.updateCard(cardId, { status: card.status === "paused" ? "active" : "paused" })
      await loadCardData()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update card")
    }
  }

  const handleCreateIntegration = async () => {
    if (!cardId || !integrationName.trim() || !integrationDescription.trim()) return
    setCreatingIntegration(true)
    setError("")
    try {
      await client.createIntegration({
        cardId,
        presetId: "custom",
        type: "custom",
        platform: "custom",
        name: integrationName.trim(),
        description: integrationDescription.trim(),
        schemaVersion: 1,
      })
      setIntegrationName("")
      setIntegrationDescription("")
      await loadCardData()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create integration")
    } finally {
      setCreatingIntegration(false)
    }
  }

  const handleRemoveIntegration = async (integrationId) => {
    setError("")
    try {
      await client.removeIntegration(integrationId)
      await loadCardData()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to remove integration")
    }
  }

  if (authLoading) {
    return <div className="flex min-h-screen items-center justify-center"><div className="animate-pulse text-muted-foreground">Loading...</div></div>
  }

  if (!isAuthenticated) {
    return <Navigate to="/app" replace />
  }

  return (
    <div className="min-h-screen p-8">
      <div className="mx-auto max-w-4xl space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link to={`/app/sdk/accounts/${accountId}`}>
              <Button variant="ghost" size="icon-sm" className="cursor-pointer">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <h1 className="text-2xl font-bold">Card (SDK)</h1>
          </div>
          <div className="flex items-center gap-4">
            <ThemeToggle />
            <button onClick={logout} className="cursor-pointer text-sm text-muted-foreground hover:text-foreground transition-colors">Sign Out</button>
          </div>
        </div>

        <ApiServiceConfigCard baseUrl={baseUrl} setBaseUrl={setBaseUrl} apiKey={apiKey} setApiKey={setApiKey} onConnect={loadCardData} isConnecting={loading} />

        <div className="rounded-lg border border-border p-4 space-y-2">
          <h2 className="text-sm font-medium text-muted-foreground">Card</h2>
          {!isConfigured ? (
            <p className="text-sm text-muted-foreground">Connect to API service first.</p>
          ) : loading ? (
            <p className="text-sm text-muted-foreground">Loading card...</p>
          ) : card ? (
            <>
              <p className="text-sm font-medium">{card.name}</p>
              <p className="text-xs text-muted-foreground">status: {card.status}</p>
              <p className="text-xs text-muted-foreground">spent: {formatEthFull(card.spent || "0")} ETH</p>
              <p className="text-xs font-mono text-muted-foreground">secret: {card.secret}</p>
              <Button onClick={togglePause} className="cursor-pointer gap-1.5" size="sm">
                {card.status === "paused" ? <Play className="h-3.5 w-3.5" /> : <Pause className="h-3.5 w-3.5" />}
                {card.status === "paused" ? "Resume" : "Pause"}
              </Button>
            </>
          ) : (
            <p className="text-sm text-muted-foreground">Card not found.</p>
          )}
        </div>

        <div className="rounded-lg border border-border p-4 space-y-3">
          <h2 className="text-sm font-medium text-muted-foreground">Integrations</h2>
          <div className="grid gap-3 sm:grid-cols-[1fr_1fr_auto]">
            <div className="space-y-2">
              <Label htmlFor="sdk-integration-name">Name</Label>
              <Input id="sdk-integration-name" value={integrationName} onChange={(event) => setIntegrationName(event.target.value)} placeholder="Integration name" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="sdk-integration-description">Description</Label>
              <Input id="sdk-integration-description" value={integrationDescription} onChange={(event) => setIntegrationDescription(event.target.value)} placeholder="What this integration does" />
            </div>
            <div className="flex items-end">
              <Button onClick={handleCreateIntegration} disabled={!isConfigured || creatingIntegration || !integrationName.trim() || !integrationDescription.trim()} className="cursor-pointer gap-1.5 w-full">
                <Plus className="h-3.5 w-3.5" />
                {creatingIntegration ? "Creating..." : "Create"}
              </Button>
            </div>
          </div>

          {integrations.length === 0 ? (
            <p className="text-sm text-muted-foreground">No integrations yet.</p>
          ) : (
            <div className="space-y-2">
              {integrations.map((integration) => (
                <div key={integration._id} className="flex items-center justify-between rounded-md border border-border p-2">
                  <div>
                    <p className="text-sm">{integration.name}</p>
                    <p className="text-xs text-muted-foreground">{integration.description}</p>
                  </div>
                  <Button variant="ghost" size="icon-sm" className="cursor-pointer" onClick={() => handleRemoveIntegration(integration._id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-lg border border-border p-4 space-y-3">
          <h2 className="text-sm font-medium text-muted-foreground">Card Transactions</h2>
          {sortedTransactions.length === 0 ? (
            <p className="text-sm text-muted-foreground">No card transactions yet.</p>
          ) : (
            <div className="space-y-2">
              {sortedTransactions.map((tx) => (
                <div key={tx._id ?? tx.hash} className="rounded-md border border-border p-2">
                  <p className="text-sm">{tx.direction === "out" ? "Sent" : "Received"} {formatEthFull(tx.value)} ETH</p>
                  <p className="text-xs text-muted-foreground font-mono">{truncateAddress(tx.from)} {"->"} {truncateAddress(tx.to)}</p>
                  <p className="text-xs text-muted-foreground">{tx.status}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {error && <p className="text-sm text-destructive">{error}</p>}
      </div>
    </div>
  )
}
