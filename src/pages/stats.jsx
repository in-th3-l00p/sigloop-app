import { useMemo } from "react"
import { Link, Navigate } from "react-router-dom"
import { usePrivy } from "@privy-io/react-auth"
import { useConvexAuth, useQuery } from "convex/react"
import { api } from "../../convex/_generated/api"
import { ArrowLeft, Activity } from "lucide-react"
import { ThemeToggle } from "@/components/theme-toggle"
import { Button } from "@/components/ui/button"

function UsageBars({ points = [] }) {
  const max = useMemo(() => points.reduce((acc, item) => Math.max(acc, item.total), 1), [points])

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

export default function StatsPage() {
  const { logout } = usePrivy()
  const { isLoading, isAuthenticated } = useConvexAuth()
  const usage = useQuery(api.apiRequestLogs.apiRequestLogs.usage, { days: 7 })

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    )
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
            <h1 className="text-2xl font-bold">API Stats</h1>
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
              {usage.total > 0 && (
                <div className="rounded-md bg-muted/50 px-3 py-2">
                  <p className="text-xs text-muted-foreground">Success Rate</p>
                  <p className="text-xl font-semibold">
                    {((usage.success / usage.total) * 100).toFixed(1)}%
                  </p>
                </div>
              )}
            </>
          )}
        </section>
      </div>
    </div>
  )
}
