import { useParams, Navigate, Link } from "react-router-dom"
import { usePrivy } from "@privy-io/react-auth"
import { useConvexAuth, useQuery } from "convex/react"
import { api } from "../../convex/_generated/api"
import { ArrowLeft } from "lucide-react"
import { ThemeToggle } from "@/components/theme-toggle"
import { GeneralInfoSection } from "@/components/account-dashboard/general-info-section"
import { TransactionsSection } from "@/components/account-dashboard/transactions-section"
import { AgentCardsSection } from "@/components/account-dashboard/agent-cards-section"
import { DefiSection } from "@/components/account-dashboard/defi-section"
import { Button } from "@/components/ui/button"

export default function AccountDashboardPage() {
  const { accountId } = useParams()
  const { logout } = usePrivy()
  const { isLoading: authLoading, isAuthenticated } = useConvexAuth()
  const account = useQuery(
    api.accounts.smartAccounts.get,
    accountId ? { id: accountId } : "skip"
  )

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

  if (account === undefined) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading account...</div>
      </div>
    )
  }

  if (account === null) {
    return <Navigate to="/app/dashboard" replace />
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
            <h1 className="text-2xl font-bold">Account</h1>
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

        <GeneralInfoSection account={account} />
        <TransactionsSection account={account} />
        <AgentCardsSection account={account} />
        <DefiSection account={account} />
      </div>
    </div>
  )
}
