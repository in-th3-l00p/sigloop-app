import { useCallback, useEffect, useState } from "react"
import { Link, Navigate } from "react-router-dom"
import { usePrivy } from "@privy-io/react-auth"
import { useConvexAuth } from "convex/react"
import { ArrowLeft, Plus } from "lucide-react"
import { ThemeToggle } from "@/components/theme-toggle"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ApiServiceConfigCard } from "@/components/api-service-config-card"
import { useApiServiceClient } from "@/hooks/use-api-service-client"
import { getChainDisplayName, SUPPORTED_CHAINS } from "@/lib/chains"

export default function SdkDashboardPage() {
  const { logout } = usePrivy()
  const { isLoading: authLoading, isAuthenticated } = useConvexAuth()
  const { client, baseUrl, setBaseUrl, apiKey, setApiKey, isConfigured } = useApiServiceClient()

  const [accounts, setAccounts] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const [name, setName] = useState("")
  const [chain, setChain] = useState("sepolia")
  const [creating, setCreating] = useState(false)

  const loadAccounts = useCallback(async () => {
    if (!isConfigured) return
    setLoading(true)
    setError("")
    try {
      const result = await client.listAccounts()
      setAccounts(result.accounts ?? [])
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load accounts")
    } finally {
      setLoading(false)
    }
  }, [client, isConfigured])

  useEffect(() => {
    void loadAccounts()
  }, [loadAccounts])

  const handleCreate = async () => {
    if (!name.trim() || !chain) return
    setCreating(true)
    setError("")
    try {
      await client.provisionAccount({
        name: name.trim(),
        chain,
        icon: "wallet",
      })
      setName("")
      await loadAccounts()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create account")
    } finally {
      setCreating(false)
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
            <Link to="/app/dashboard">
              <Button variant="ghost" size="icon-sm" className="cursor-pointer">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <h1 className="text-2xl font-bold">SDK Mode</h1>
          </div>
          <div className="flex items-center gap-4">
            <ThemeToggle />
            <button onClick={logout} className="cursor-pointer text-sm text-muted-foreground hover:text-foreground transition-colors">Sign Out</button>
          </div>
        </div>

        <ApiServiceConfigCard
          baseUrl={baseUrl}
          setBaseUrl={setBaseUrl}
          apiKey={apiKey}
          setApiKey={setApiKey}
          onConnect={loadAccounts}
          isConnecting={loading}
        />

        <div className="rounded-lg border border-border p-4 space-y-3">
          <h2 className="text-sm font-medium text-muted-foreground">Create Account (API Service)</h2>
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="sdk-account-name">Name</Label>
              <Input id="sdk-account-name" value={name} onChange={(event) => setName(event.target.value)} placeholder="Operations Wallet" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="sdk-account-chain">Chain</Label>
              <select
                id="sdk-account-chain"
                value={chain}
                onChange={(event) => setChain(event.target.value)}
                className="h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm"
              >
                {SUPPORTED_CHAINS.map((item) => (
                  <option key={item.id} value={item.id}>{item.name}</option>
                ))}
              </select>
            </div>
          </div>
          <Button onClick={handleCreate} disabled={!isConfigured || creating || !name.trim()} className="cursor-pointer gap-1.5">
            <Plus className="h-3.5 w-3.5" />
            {creating ? "Creating..." : "Create"}
          </Button>
        </div>

        <div className="rounded-lg border border-border p-4 space-y-3">
          <h2 className="text-sm font-medium text-muted-foreground">Accounts</h2>
          {!isConfigured ? (
            <p className="text-sm text-muted-foreground">Enter API base URL and key to load accounts.</p>
          ) : loading ? (
            <p className="text-sm text-muted-foreground">Loading accounts...</p>
          ) : accounts.length === 0 ? (
            <p className="text-sm text-muted-foreground">No accounts yet.</p>
          ) : (
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {accounts.map((account) => (
                <Link
                  key={account._id}
                  to={`/app/sdk/accounts/${account._id}`}
                  className="rounded-md border border-border p-3 hover:bg-accent/40"
                >
                  <p className="text-sm font-medium">{account.name}</p>
                  <p className="text-xs text-muted-foreground">{getChainDisplayName(account.chain)}</p>
                  <p className="text-xs font-mono text-muted-foreground mt-1">{account.address}</p>
                </Link>
              ))}
            </div>
          )}
          {error && <p className="text-sm text-destructive">{error}</p>}
        </div>
      </div>
    </div>
  )
}
