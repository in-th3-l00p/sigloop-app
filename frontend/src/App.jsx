import { Routes, Route, Navigate } from "react-router-dom"
import { usePrivy } from "@privy-io/react-auth"
import LoginPage from "@/pages/login"
import DashboardPage from "@/pages/dashboard"
import AccountDashboardPage from "@/pages/account-dashboard"
import CardDashboardPage from "@/pages/card-dashboard"
import ApiDashboardPage from "@/pages/api-dashboard"
import DocsPage from "@/pages/docs"
import StatsPage from "@/pages/stats"
import LogsPage from "@/pages/logs"

function App() {
  const { ready } = usePrivy()

  if (!ready) {
    return null
  }

  return (
    <Routes>
      <Route path="/app" element={<Navigate to="/" replace />} />
      <Route path="/app/dashboard" element={<Navigate to="/dashboard" replace />} />
      <Route path="/app/api" element={<Navigate to="/api" replace />} />
      <Route path="/app/docs" element={<Navigate to="/docs" replace />} />
      <Route path="/app/stats" element={<Navigate to="/stats" replace />} />
      <Route path="/app/logs" element={<Navigate to="/logs" replace />} />
      <Route path="/app/dashboard/:accountId" element={<Navigate to="/dashboard" replace />} />
      <Route path="/app/dashboard/:accountId/card/:cardId" element={<Navigate to="/dashboard" replace />} />
      <Route path="/" element={<LoginPage />} />
      <Route path="/dashboard" element={<DashboardPage />} />
      <Route path="/api" element={<ApiDashboardPage />} />
      <Route path="/docs" element={<DocsPage />} />
      <Route path="/stats" element={<StatsPage />} />
      <Route path="/logs" element={<LogsPage />} />
      <Route path="/dashboard/:accountId" element={<AccountDashboardPage />} />
      <Route path="/dashboard/:accountId/card/:cardId" element={<CardDashboardPage />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default App
