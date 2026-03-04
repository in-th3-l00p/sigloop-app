import { useMemo, useState } from "react"
import { Link, Navigate } from "react-router-dom"
import { usePrivy } from "@privy-io/react-auth"
import { useConvexAuth, useMutation, useQuery } from "convex/react"
import { api } from "../../convex/_generated/api"
import { ArrowLeft, Copy, KeyRound, Trash2, Activity } from "lucide-react"
import { ThemeToggle } from "@/components/theme-toggle"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useCopyToClipboard } from "@/hooks/use-copy-to-clipboard"

function formatDate(value) {
  return new Date(value).toLocaleString("en-US")
}

function UsageBars({ points = [] }) {
  const max = useMemo(() => {
    return points.reduce((acc, item) => Math.max(acc, item.total), 1)
  }, [points])

  if (points.length === 0) {
    return <p className="text-sm text-muted-foreground">No API traffic yet.</p>
  }

  return (
    <div className="space-y-2">
      {points.map((item) => {
        const width = Math.max(4, Math.round((item.total / max) * 100))
        return (
          <div key={item.day} className="space-y-1">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>{item.day}</span>
              <span>{item.total} req</span>
            </div>
            <div className="h-2 rounded-full bg-muted overflow-hidden">
              <div className="h-full bg-primary rounded-full" style={{ width: `${width}%` }} />
            </div>
          </div>
        )
      })}
    </div>
  )
}

export default function ApiDashboardPage() {
  const { logout } = usePrivy()
  const { isLoading: authLoading, isAuthenticated } = useConvexAuth()
  const usage = useQuery(api.apiRequestLogs.apiRequestLogs.usage, { days: 7 })
  const logs = useQuery(api.apiRequestLogs.apiRequestLogs.list, { limit: 100 })
  const keys = useQuery(api.apiKeys.apiKeys.list)
  const createKey = useMutation(api.apiKeys.apiKeys.create)
  const revokeKey = useMutation(api.apiKeys.apiKeys.revoke)

  const [newKeyName, setNewKeyName] = useState("")
  const [lastCreated, setLastCreated] = useState(null)
  const [copied, copy] = useCopyToClipboard()

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/app" replace />
  }

  const onCreateKey = async () => {
    if (!newKeyName.trim()) return
    const created = await createKey({ name: newKeyName.trim() })
    setLastCreated(created)
    setNewKeyName("")
  }

  return (
    <div className="min-h-screen p-8">
      <div className="mx-auto max-w-5xl space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link to="/app/dashboard">
              <Button variant="ghost" size="icon-sm" className="cursor-pointer">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <h1 className="text-2xl font-bold">API Access</h1>
          </div>
          <div className="flex items-center gap-4">
            <ThemeToggle />
            <button
              onClick={logout}
              className="cursor-pointer text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Sign Out
            </button>
          </div>
        </div>

        <section className="rounded-lg border border-border p-5 space-y-4">
          <div className="flex items-center gap-2">
            <Activity className="h-4 w-4 text-muted-foreground" />
            <h2 className="text-sm font-medium text-muted-foreground">API Usage (7 days)</h2>
          </div>
          {usage === undefined ? (
            <p className="text-sm text-muted-foreground">Loading usage...</p>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="rounded-md bg-muted/50 px-3 py-2">
                  <p className="text-xs text-muted-foreground">Total</p>
                  <p className="text-xl font-semibold">{usage.total}</p>
                </div>
                <div className="rounded-md bg-muted/50 px-3 py-2">
                  <p className="text-xs text-muted-foreground">Success</p>
                  <p className="text-xl font-semibold">{usage.success}</p>
                </div>
                <div className="rounded-md bg-muted/50 px-3 py-2">
                  <p className="text-xs text-muted-foreground">Error</p>
                  <p className="text-xl font-semibold">{usage.error}</p>
                </div>
              </div>
              <UsageBars points={usage.perDay} />
            </>
          )}
        </section>

        <section className="rounded-lg border border-border p-5 space-y-4">
          <h2 className="text-sm font-medium text-muted-foreground">API Logs</h2>
          {logs === undefined ? (
            <p className="text-sm text-muted-foreground">Loading logs...</p>
          ) : logs.length === 0 ? (
            <p className="text-sm text-muted-foreground">No requests logged yet.</p>
          ) : (
            <div className="max-h-80 overflow-y-auto rounded-md border border-border">
              <table className="w-full text-sm">
                <thead className="bg-muted/50 text-left text-xs text-muted-foreground">
                  <tr>
                    <th className="px-3 py-2">Time</th>
                    <th className="px-3 py-2">Method</th>
                    <th className="px-3 py-2">Path</th>
                    <th className="px-3 py-2">Status</th>
                    <th className="px-3 py-2">Duration</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map((row) => (
                    <tr key={row._id} className="border-t border-border">
                      <td className="px-3 py-2">{formatDate(row.createdAt)}</td>
                      <td className="px-3 py-2 font-mono">{row.method}</td>
                      <td className="px-3 py-2 font-mono text-xs">{row.path}</td>
                      <td className="px-3 py-2">{row.statusCode}</td>
                      <td className="px-3 py-2">{row.durationMs}ms</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <section className="rounded-lg border border-border p-5 space-y-4">
          <div className="flex items-center gap-2">
            <KeyRound className="h-4 w-4 text-muted-foreground" />
            <h2 className="text-sm font-medium text-muted-foreground">API Keys</h2>
          </div>

          <div className="flex flex-col sm:flex-row gap-2">
            <Input
              placeholder="Key name (e.g. Production Backend)"
              value={newKeyName}
              onChange={(event) => setNewKeyName(event.target.value)}
            />
            <Button onClick={onCreateKey} className="cursor-pointer">
              Create Key
            </Button>
          </div>

          {lastCreated && (
            <div className="rounded-md border border-primary/30 bg-primary/5 p-3 space-y-2">
              <p className="text-xs text-muted-foreground">
                Save this now. The full key is shown only once.
              </p>
              <div className="flex items-center gap-2">
                <code className="flex-1 overflow-x-auto rounded bg-muted px-2 py-1 text-xs">{lastCreated.apiKey}</code>
                <Button variant="outline" size="sm" className="cursor-pointer" onClick={() => copy(lastCreated.apiKey)}>
                  <Copy className="h-3.5 w-3.5" />
                  {copied ? "Copied" : "Copy"}
                </Button>
              </div>
            </div>
          )}

          {keys === undefined ? (
            <p className="text-sm text-muted-foreground">Loading keys...</p>
          ) : keys.length === 0 ? (
            <p className="text-sm text-muted-foreground">No API keys yet.</p>
          ) : (
            <div className="space-y-2">
              {keys.map((key) => (
                <div key={key._id} className="rounded-md border border-border p-3 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-medium">{key.name}</p>
                    <p className="text-xs text-muted-foreground font-mono">
                      {key.keyPrefix}... | {key.status} | created {formatDate(key.createdAt)}
                    </p>
                    {key.lastUsedAt && (
                      <p className="text-xs text-muted-foreground">last used {formatDate(key.lastUsedAt)}</p>
                    )}
                  </div>
                  <Button
                    variant="destructive"
                    size="sm"
                    className="cursor-pointer"
                    disabled={key.status === "revoked"}
                    onClick={() => revokeKey({ id: key._id })}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    Revoke
                  </Button>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  )
}
