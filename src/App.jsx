import { usePrivy } from "@privy-io/react-auth"
import { useConvexAuth, useQuery } from "convex/react"
import { api } from "../convex/_generated/api"
import "./App.css"

function LoginScreen() {
  const { login } = usePrivy()

  return (
    <div className="card">
      <h1>sigloop</h1>
      <p>Sign in to get started</p>
      <button onClick={login}>Log In</button>
    </div>
  )
}

function Dashboard() {
  const { user, logout } = usePrivy()
  const viewer = useQuery(api.auth.viewer)

  return (
    <div className="card">
      <h1>sigloop</h1>
      <p>Logged in as: {user?.email?.address ?? user?.wallet?.address ?? user?.id}</p>

      <h2>Convex Auth Check</h2>
      {viewer === undefined && <p>Loading...</p>}
      {viewer === null && <p>Not authenticated on Convex</p>}
      {viewer && (
        <div style={{ textAlign: "left", background: "#1a1a2e", padding: "1rem", borderRadius: "8px" }}>
          <p><strong>Subject:</strong> {viewer.subject}</p>
          <p><strong>Issuer:</strong> {viewer.issuer}</p>
          <p><strong>Token ID:</strong> {viewer.tokenIdentifier}</p>
        </div>
      )}

      <button onClick={logout} style={{ marginTop: "1rem" }}>Log Out</button>
    </div>
  )
}

function App() {
  const { isLoading, isAuthenticated } = useConvexAuth()

  if (isLoading) {
    return (
      <div className="card">
        <p>Loading...</p>
      </div>
    )
  }

  return isAuthenticated ? <Dashboard /> : <LoginScreen />
}

export default App
