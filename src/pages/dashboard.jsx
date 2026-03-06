import { usePrivy } from "@privy-io/react-auth"
import { useConvexAuth, useQuery } from "convex/react"
import { api } from "../../convex/_generated/api"
import { Navigate } from "react-router-dom"
import { Link } from "react-router-dom"
import { Settings, Mail, Wallet, KeyRound, BookOpen, Activity, FileText } from "lucide-react"
import { ThemeToggle } from "@/components/theme-toggle"
import { AccountDrawer } from "@/components/account-drawer"
import { SmartAccountsSection } from "@/components/smart-accounts-section"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

function AccountSection() {
  const { user } = usePrivy()

  const displayName = user?.email?.address
    ?? (user?.wallet?.address
      ? `${user.wallet.address.slice(0, 6)}...${user.wallet.address.slice(-4)}`
      : user?.id)

  const linkedCount = user?.linkedAccounts?.length ?? 0

  return (
    <div className="rounded-lg border border-border p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3 min-w-0">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
            <span className="text-sm font-medium">
              {(user?.email?.address?.[0] ?? user?.id?.[0] ?? "?").toUpperCase()}
            </span>
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium truncate">{displayName}</p>
            <div className="flex items-center gap-2 mt-0.5">
              {user?.email && (
                <Badge variant="secondary" className="text-xs h-5 gap-1">
                  <Mail className="h-3 w-3" />
                  Email
                </Badge>
              )}
              {user?.wallet && (
                <Badge variant="secondary" className="text-xs h-5 gap-1">
                  <Wallet className="h-3 w-3" />
                  Wallet
                </Badge>
              )}
              {linkedCount > 0 && (
                <span className="text-xs text-muted-foreground">
                  {linkedCount} linked
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <AccountDrawer>
            <Button variant="outline" size="sm" className="cursor-pointer gap-1.5">
              <Settings className="h-3.5 w-3.5" />
              Manage
            </Button>
          </AccountDrawer>
        </div>
      </div>
    </div>
  )
}

const QUICK_ACCESS_ITEMS = [
  { to: "/app/api", label: "API Access", icon: KeyRound, desc: "Manage keys" },
  { to: "/app/docs", label: "Docs", icon: BookOpen, desc: "Documentation" },
  { to: "/app/stats", label: "Stats", icon: Activity, desc: "API usage" },
  { to: "/app/logs", label: "Logs", icon: FileText, desc: "Request logs" },
]

function QuickAccessSection() {
  return (
    <div className="space-y-3">
      <h2 className="text-sm font-medium text-muted-foreground">Quick Access</h2>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
        {QUICK_ACCESS_ITEMS.map((item) => {
          const Icon = item.icon
          return (
            <Link
              key={item.to}
              to={item.to}
              className="flex items-center gap-3 rounded-lg border border-border p-3 text-left transition-colors hover:bg-accent/50 cursor-pointer w-full"
            >
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
                <Icon className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium truncate">{item.label}</p>
                <p className="text-xs text-muted-foreground">{item.desc}</p>
              </div>
            </Link>
          )
        })}
      </div>
    </div>
  )
}

function ApiUsageSection() {
  const usage = useQuery(api.apiRequestLogs.apiRequestLogs.usage, { days: 7 })

  if (usage === undefined) return null

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-medium text-muted-foreground">API Usage (7 days)</h2>
        <Link to="/app/stats">
          <Button variant="ghost" size="sm" className="cursor-pointer text-xs text-muted-foreground">
            View details
          </Button>
        </Link>
      </div>
      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-md bg-muted/50 px-3 py-2">
          <p className="text-xs text-muted-foreground">Total</p>
          <p className="text-lg font-semibold">{usage.total}</p>
        </div>
        <div className="rounded-md bg-muted/50 px-3 py-2">
          <p className="text-xs text-muted-foreground">Success</p>
          <p className="text-lg font-semibold">{usage.success}</p>
        </div>
        <div className="rounded-md bg-muted/50 px-3 py-2">
          <p className="text-xs text-muted-foreground">Error</p>
          <p className="text-lg font-semibold">{usage.error}</p>
        </div>
      </div>
    </div>
  )
}

export default function DashboardPage() {
  const { logout } = usePrivy()
  const { isLoading, isAuthenticated } = useConvexAuth()
  const accounts = useQuery(api.accounts.smartAccounts.list) ?? []

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
          <h1 className="text-2xl font-bold">Dashboard</h1>
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

        <AccountSection />
        <QuickAccessSection />
        <ApiUsageSection />
        <SmartAccountsSection accounts={accounts} />
      </div>
    </div>
  )
}
