import { Routes, Route, Navigate } from "react-router-dom"
import { usePrivy } from "@privy-io/react-auth"
import LoginPage from "@/pages/login"
import DashboardPage from "@/pages/dashboard"
import AccountDashboardPage from "@/pages/account-dashboard"
import CardDashboardPage from "@/pages/card-dashboard"
import ApiDashboardPage from "@/pages/api-dashboard"
import SdkDashboardPage from "@/pages/sdk-dashboard"
import SdkAccountDashboardPage from "@/pages/sdk-account-dashboard"
import SdkCardDashboardPage from "@/pages/sdk-card-dashboard"

function App() {
  const { ready } = usePrivy()

  if (!ready) {
    return null
  }

  return (
    <Routes>
      <Route path="/app" element={<LoginPage />} />
      <Route path="/app/dashboard" element={<DashboardPage />} />
      <Route path="/app/api" element={<ApiDashboardPage />} />
      <Route path="/app/sdk/dashboard" element={<SdkDashboardPage />} />
      <Route path="/app/sdk/accounts/:accountId" element={<SdkAccountDashboardPage />} />
      <Route path="/app/sdk/accounts/:accountId/cards/:cardId" element={<SdkCardDashboardPage />} />
      <Route path="/app/dashboard/:accountId" element={<AccountDashboardPage />} />
      <Route path="/app/dashboard/:accountId/card/:cardId" element={<CardDashboardPage />} />
      <Route path="*" element={<Navigate to="/app" replace />} />
    </Routes>
  )
}

export default App
