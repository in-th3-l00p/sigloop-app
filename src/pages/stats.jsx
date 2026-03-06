import { useMemo } from "react"
import { Link, Navigate } from "react-router-dom"
import { usePrivy } from "@privy-io/react-auth"
import { useConvexAuth, useQuery } from "convex/react"
import { api } from "../../convex/_generated/api"
import { ArrowLeft, Activity } from "lucide-react"
import { ThemeToggle } from "@/components/theme-toggle"
import { Button } from "@/components/ui/button"
import {
  BarChart,
  Bar,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts"

function StatsTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-md border border-border bg-background px-3 py-2 text-xs shadow-sm">
      <p className="font-medium mb-1">{label}</p>
      {payload.map((entry) => (
        <p key={entry.name} style={{ color: entry.color }}>
          {entry.name}: {entry.value}
        </p>
      ))}
    </div>
  )
}

const CHART_COLORS = {
  success: "hsl(142, 71%, 45%)",
  error: "hsl(0, 84%, 60%)",
  total: "hsl(221, 83%, 53%)",
}

const PIE_COLORS = [CHART_COLORS.success, CHART_COLORS.error]

function DailyBarChart({ points }) {
  if (points.length === 0) {
    return <p className="text-sm text-muted-foreground">No data yet.</p>
  }

  return (
    <ResponsiveContainer width="100%" height={240}>
      <BarChart data={points} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
        <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
        <XAxis dataKey="day" tick={{ fontSize: 11 }} className="fill-muted-foreground" tickFormatter={(v) => v.slice(5)} />
        <YAxis tick={{ fontSize: 11 }} className="fill-muted-foreground" allowDecimals={false} />
        <Tooltip content={<StatsTooltip />} />
        <Bar dataKey="success" name="Success" fill={CHART_COLORS.success} radius={[3, 3, 0, 0]} stackId="a" />
        <Bar dataKey="error" name="Error" fill={CHART_COLORS.error} radius={[3, 3, 0, 0]} stackId="a" />
      </BarChart>
    </ResponsiveContainer>
  )
}

function DailyAreaChart({ points }) {
  if (points.length === 0) {
    return <p className="text-sm text-muted-foreground">No data yet.</p>
  }

  return (
    <ResponsiveContainer width="100%" height={200}>
      <AreaChart data={points} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
        <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
        <XAxis dataKey="day" tick={{ fontSize: 11 }} className="fill-muted-foreground" tickFormatter={(v) => v.slice(5)} />
        <YAxis tick={{ fontSize: 11 }} className="fill-muted-foreground" allowDecimals={false} />
        <Tooltip content={<StatsTooltip />} />
        <Area type="monotone" dataKey="total" name="Total" stroke={CHART_COLORS.total} fill={CHART_COLORS.total} fillOpacity={0.15} strokeWidth={2} />
      </AreaChart>
    </ResponsiveContainer>
  )
}

function StatusPieChart({ success, error }) {
  const data = useMemo(() => [
    { name: "Success", value: success },
    { name: "Error", value: error },
  ].filter((d) => d.value > 0), [success, error])

  if (data.length === 0) {
    return <p className="text-sm text-muted-foreground">No data yet.</p>
  }

  return (
    <ResponsiveContainer width="100%" height={200}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          innerRadius={50}
          outerRadius={80}
          paddingAngle={3}
          dataKey="value"
        >
          {data.map((entry, i) => (
            <Cell key={entry.name} fill={PIE_COLORS[i % PIE_COLORS.length]} />
          ))}
        </Pie>
        <Tooltip content={<StatsTooltip />} />
      </PieChart>
    </ResponsiveContainer>
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
      <div className="mx-auto max-w-4xl space-y-8">
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

        {usage === undefined ? (
          <p className="text-sm text-muted-foreground">Loading usage...</p>
        ) : (
          <>
            <section className="space-y-4 border-b border-border pb-8">
              <div className="flex items-center gap-2">
                <Activity className="h-4 w-4 text-muted-foreground" />
                <h2 className="text-sm font-medium text-muted-foreground">Overview (7 days)</h2>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
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
                {usage.total > 0 && (
                  <div className="rounded-md bg-muted/50 px-3 py-2">
                    <p className="text-xs text-muted-foreground">Success Rate</p>
                    <p className="text-xl font-semibold">
                      {((usage.success / usage.total) * 100).toFixed(1)}%
                    </p>
                  </div>
                )}
              </div>
            </section>

            <section className="space-y-4 border-b border-border pb-8">
              <h2 className="text-sm font-medium text-muted-foreground">Daily Requests</h2>
              <DailyBarChart points={usage.perDay} />
            </section>

            <section className="space-y-4 border-b border-border pb-8">
              <h2 className="text-sm font-medium text-muted-foreground">Traffic Trend</h2>
              <DailyAreaChart points={usage.perDay} />
            </section>

            <section className="space-y-4">
              <h2 className="text-sm font-medium text-muted-foreground">Success vs Error</h2>
              <div className="flex items-center justify-center">
                <div className="w-64">
                  <StatusPieChart success={usage.success} error={usage.error} />
                </div>
                <div className="space-y-2 ml-4">
                  <div className="flex items-center gap-2">
                    <div className="h-3 w-3 rounded-full" style={{ backgroundColor: CHART_COLORS.success }} />
                    <span className="text-sm text-muted-foreground">Success ({usage.success})</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="h-3 w-3 rounded-full" style={{ backgroundColor: CHART_COLORS.error }} />
                    <span className="text-sm text-muted-foreground">Error ({usage.error})</span>
                  </div>
                </div>
              </div>
            </section>
          </>
        )}
      </div>
    </div>
  )
}
