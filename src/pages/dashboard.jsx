import { usePrivy } from "@privy-io/react-auth"
import { useConvexAuth, useQuery } from "convex/react"
import { api } from "../../convex/_generated/api"
import { Navigate } from "react-router-dom"
import { Link } from "react-router-dom"
import { Settings, Mail, Wallet } from "lucide-react"
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
          <Link to="/app/api">
            <Button variant="outline" size="sm" className="cursor-pointer">
              API
            </Button>
          </Link>
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
        <SmartAccountsSection accounts={accounts} />
      </div>
    </div>
  )
}
