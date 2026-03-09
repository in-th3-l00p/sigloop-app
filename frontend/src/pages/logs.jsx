import { useState } from "react"
import { Link, Navigate } from "react-router-dom"
import { usePrivy } from "@privy-io/react-auth"
import { useConvexAuth, useQuery } from "convex/react"
import { api } from "../../convex/_generated/api"
import { ArrowLeft } from "lucide-react"
import { ThemeToggle } from "@/components/theme-toggle"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

function formatDate(value) {
  return new Date(value).toLocaleString("en-US")
}

export default function LogsPage() {
  const { logout } = usePrivy()
  const { isLoading: authLoading, isAuthenticated } = useConvexAuth()

  const [cursor, setCursor] = useState(0)
  const [cursorHistory, setCursorHistory] = useState([])
  const [methodFilter, setMethodFilter] = useState("")
  const [pathFilter, setPathFilter] = useState("")
  const [statusMin, setStatusMin] = useState("")
  const [statusMax, setStatusMax] = useState("")

  const logsResult = useQuery(api.apiRequestLogs.apiRequestLogs.list, {
    limit: 25,
    cursor,
    method: methodFilter || undefined,
    pathContains: pathFilter || undefined,
    statusMin: statusMin ? Number(statusMin) : undefined,
    statusMax: statusMax ? Number(statusMax) : undefined,
  })

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/" replace />
  }

  const logs = logsResult?.items ?? []

  return (
    <div className="min-h-screen p-8">
      <div className="mx-auto max-w-4xl space-y-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link to="/dashboard">
              <Button variant="ghost" size="icon-sm" className="cursor-pointer">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <h1 className="text-2xl font-bold">API Logs</h1>
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

        <section className="space-y-4">
          <h2 className="text-sm font-medium text-muted-foreground">Filters</h2>
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
            <div className="space-y-2">
              <Label htmlFor="log-method">Method</Label>
              <Input id="log-method" placeholder="GET/POST..." value={methodFilter} onChange={(event) => { setMethodFilter(event.target.value); setCursor(0); setCursorHistory([]) }} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="log-path">Path Contains</Label>
              <Input id="log-path" placeholder="/v1/accounts" value={pathFilter} onChange={(event) => { setPathFilter(event.target.value); setCursor(0); setCursorHistory([]) }} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="log-status-min">Status Min</Label>
              <Input id="log-status-min" placeholder="200" value={statusMin} onChange={(event) => { setStatusMin(event.target.value); setCursor(0); setCursorHistory([]) }} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="log-status-max">Status Max</Label>
              <Input id="log-status-max" placeholder="599" value={statusMax} onChange={(event) => { setStatusMax(event.target.value); setCursor(0); setCursorHistory([]) }} />
            </div>
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="text-sm font-medium text-muted-foreground">Request Logs</h2>
          {logsResult === undefined ? (
            <p className="text-sm text-muted-foreground">Loading logs...</p>
          ) : logs.length === 0 ? (
            <p className="text-sm text-muted-foreground">No requests logged yet.</p>
          ) : (
            <>
              <div className="overflow-x-auto rounded-md border border-border">
                <table className="w-full text-sm">
                  <thead className="bg-muted/50 text-left text-xs text-muted-foreground">
                    <tr>
                      <th className="px-3 py-2">Time</th>
                      <th className="px-3 py-2">Method</th>
                      <th className="px-3 py-2">Path</th>
                      <th className="px-3 py-2">Status</th>
                      <th className="px-3 py-2">IP</th>
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
                        <td className="px-3 py-2 text-xs">{row.ipAddress ?? "-"}</td>
                        <td className="px-3 py-2">{row.durationMs}ms</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="flex items-center justify-between">
                <p className="text-xs text-muted-foreground">Total filtered: {logsResult.total}</p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="cursor-pointer"
                    disabled={cursorHistory.length === 0}
                    onClick={() => {
                      const prevHistory = [...cursorHistory]
                      const previous = prevHistory.pop()
                      setCursorHistory(prevHistory)
                      setCursor(previous ?? 0)
                    }}
                  >
                    Prev
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="cursor-pointer"
                    disabled={logsResult.nextCursor === null}
                    onClick={() => {
                      setCursorHistory([...cursorHistory, cursor])
                      setCursor(logsResult.nextCursor ?? cursor)
                    }}
                  >
                    Next
                  </Button>
                </div>
              </div>
            </>
          )}
        </section>
      </div>
    </div>
  )
}
