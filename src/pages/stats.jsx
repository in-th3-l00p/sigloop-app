import { useMemo } from "react"
import { Link, Navigate } from "react-router-dom"
import { usePrivy } from "@privy-io/react-auth"
import { useConvexAuth, useQuery } from "convex/react"
import { api } from "../../convex/_generated/api"
import { ArrowLeft, Wallet, CreditCard, ArrowUpDown, KeyRound, Activity, Users } from "lucide-react"
import { ThemeToggle } from "@/components/theme-toggle"
import { Button } from "@/components/ui/button"

function StatCard({ icon: Icon, label, value, sub }) {
  return (
    <div className="rounded-md bg-muted/50 px-3 py-3 space-y-1">
      <div className="flex items-center gap-2">
        <Icon className="h-3.5 w-3.5 text-muted-foreground" />
        <p className="text-xs text-muted-foreground">{label}</p>
      </div>
      <p className="text-xl font-semibold">{value}</p>
      {sub && <p className="text-xs text-muted-foreground">{sub}</p>}
    </div>
  )
}

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

function CardStatsForAccount({ accountId }) {
  const cards = useQuery(api.agentCards.agentCards.list, { accountId })
  const txs = useQuery(api.transactions.transactions.listByAccount, { accountId })

  return { cards: cards ?? [], txs: txs ?? [] }
}

function useAllCardsAndTxs(accounts) {
  const results = accounts.map((a) => CardStatsForAccount({ accountId: a._id }))

  const allCards = results.flatMap((r) => r.cards)
  const allTxs = results.flatMap((r) => r.txs)

  return { allCards, allTxs }
}

export default function StatsPage() {
  const { logout } = usePrivy()
  const { isLoading, isAuthenticated } = useConvexAuth()
  const accounts = useQuery(api.accounts.smartAccounts.list) ?? []
  const apiKeys = useQuery(api.apiKeys.apiKeys.list)
  const contacts = useQuery(api.contacts.contacts.list)
  const apiUsage = useQuery(api.apiRequestLogs.apiRequestLogs.usage, { days: 7 })
  const { allCards, allTxs } = useAllCardsAndTxs(accounts)

  const txStats = useMemo(() => {
    const success = allTxs.filter((t) => t.status === "success").length
    const pending = allTxs.filter((t) => t.status === "progress").length
    const failed = allTxs.filter((t) => t.status === "error").length
    return { total: allTxs.length, success, pending, failed }
  }, [allTxs])

  const cardStats = useMemo(() => {
    const active = allCards.filter((c) => c.status === "active").length
    const paused = allCards.filter((c) => c.status === "paused").length
    return { total: allCards.length, active, paused }
  }, [allCards])

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
            <h1 className="text-2xl font-bold">Stats</h1>
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

        <section className="space-y-4 border-b border-border pb-8">
          <h2 className="text-sm font-medium text-muted-foreground">Overview</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            <StatCard icon={Wallet} label="Smart Accounts" value={accounts.length} />
            <StatCard
              icon={CreditCard}
              label="Agent Cards"
              value={cardStats.total}
              sub={cardStats.total > 0 ? `${cardStats.active} active, ${cardStats.paused} paused` : undefined}
            />
            <StatCard
              icon={ArrowUpDown}
              label="Transactions"
              value={txStats.total}
              sub={txStats.total > 0 ? `${txStats.success} ok, ${txStats.pending} pending, ${txStats.failed} failed` : undefined}
            />
            <StatCard icon={KeyRound} label="API Keys" value={apiKeys?.length ?? 0} />
            <StatCard icon={Users} label="Contacts" value={contacts?.length ?? 0} />
            {apiUsage && (
              <StatCard
                icon={Activity}
                label="API Requests (7d)"
                value={apiUsage.total}
                sub={apiUsage.total > 0 ? `${apiUsage.success} ok, ${apiUsage.error} errors` : undefined}
              />
            )}
          </div>
        </section>

        <section className="space-y-4 border-b border-border pb-8">
          <h2 className="text-sm font-medium text-muted-foreground">Transactions</h2>
          {txStats.total === 0 ? (
            <p className="text-sm text-muted-foreground">No transactions yet.</p>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="rounded-md bg-muted/50 px-3 py-2">
                <p className="text-xs text-muted-foreground">Total</p>
                <p className="text-xl font-semibold">{txStats.total}</p>
              </div>
              <div className="rounded-md bg-muted/50 px-3 py-2">
                <p className="text-xs text-muted-foreground">Success</p>
                <p className="text-xl font-semibold">{txStats.success}</p>
              </div>
              <div className="rounded-md bg-muted/50 px-3 py-2">
                <p className="text-xs text-muted-foreground">Pending</p>
                <p className="text-xl font-semibold">{txStats.pending}</p>
              </div>
              <div className="rounded-md bg-muted/50 px-3 py-2">
                <p className="text-xs text-muted-foreground">Failed</p>
                <p className="text-xl font-semibold">{txStats.failed}</p>
              </div>
            </div>
          )}
        </section>

        <section className="space-y-4 border-b border-border pb-8">
          <h2 className="text-sm font-medium text-muted-foreground">Agent Cards</h2>
          {cardStats.total === 0 ? (
            <p className="text-sm text-muted-foreground">No agent cards yet.</p>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <div className="rounded-md bg-muted/50 px-3 py-2">
                <p className="text-xs text-muted-foreground">Total</p>
                <p className="text-xl font-semibold">{cardStats.total}</p>
              </div>
              <div className="rounded-md bg-muted/50 px-3 py-2">
                <p className="text-xs text-muted-foreground">Active</p>
                <p className="text-xl font-semibold">{cardStats.active}</p>
              </div>
              <div className="rounded-md bg-muted/50 px-3 py-2">
                <p className="text-xs text-muted-foreground">Paused</p>
                <p className="text-xl font-semibold">{cardStats.paused}</p>
              </div>
            </div>
          )}
        </section>

        <section className="space-y-4">
          <h2 className="text-sm font-medium text-muted-foreground">API Usage (7 days)</h2>
          {apiUsage === undefined ? (
            <p className="text-sm text-muted-foreground">Loading usage...</p>
          ) : apiUsage.total === 0 ? (
            <p className="text-sm text-muted-foreground">No API traffic yet.</p>
          ) : (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="rounded-md bg-muted/50 px-3 py-2">
                  <p className="text-xs text-muted-foreground">Total</p>
                  <p className="text-xl font-semibold">{apiUsage.total}</p>
                </div>
                <div className="rounded-md bg-muted/50 px-3 py-2">
                  <p className="text-xs text-muted-foreground">Success</p>
                  <p className="text-xl font-semibold">{apiUsage.success}</p>
                </div>
                <div className="rounded-md bg-muted/50 px-3 py-2">
                  <p className="text-xs text-muted-foreground">Error</p>
                  <p className="text-xl font-semibold">{apiUsage.error}</p>
                </div>
                <div className="rounded-md bg-muted/50 px-3 py-2">
                  <p className="text-xs text-muted-foreground">Success Rate</p>
                  <p className="text-xl font-semibold">
                    {((apiUsage.success / apiUsage.total) * 100).toFixed(1)}%
                  </p>
                </div>
              </div>
              <UsageBars points={apiUsage.perDay} />
            </>
          )}
        </section>
      </div>
    </div>
  )
}
