import { Routes, Route, Navigate } from "react-router-dom"
import LoginPage from "@/pages/login"
import DashboardPage from "@/pages/dashboard"
import AccountDashboardPage from "@/pages/account-dashboard"
import CardDashboardPage from "@/pages/card-dashboard"

function App() {
  return (
    <Routes>
      <Route path="/app" element={<LoginPage />} />
      <Route path="/app/dashboard" element={<DashboardPage />} />
      <Route path="/app/dashboard/:accountId" element={<AccountDashboardPage />} />
      <Route path="/app/dashboard/:accountId/card/:cardId" element={<CardDashboardPage />} />
      <Route path="*" element={<Navigate to="/app" replace />} />
    </Routes>
  )
}

export default App
