import { useCallback, useMemo } from "react"
import { ConvexProviderWithAuth, ConvexReactClient } from "convex/react"
import { PrivyProvider, usePrivy } from "@privy-io/react-auth"

const convex = new ConvexReactClient(import.meta.env.VITE_CONVEX_URL)

function useAuthFromPrivy() {
  const { ready, authenticated, getAccessToken } = usePrivy()

  const fetchAccessToken = useCallback(
    async ({ forceRefreshToken }) => {
      try {
        console.log("[auth-bridge] fetchAccessToken called", {
          ready,
          authenticated,
          forceRefreshToken,
        })
        const token = await getAccessToken()
        if (token) {
          console.log("[auth-bridge] token obtained, length:", token.length)
          // Log decoded payload (non-sensitive claims) for debugging
          try {
            const payload = JSON.parse(atob(token.split(".")[1]))
            console.log("[auth-bridge] token payload:", {
              iss: payload.iss,
              sub: payload.sub,
              aud: payload.aud,
              exp: payload.exp,
              iat: payload.iat,
              expIn: payload.exp
                ? `${Math.round((payload.exp * 1000 - Date.now()) / 1000)}s`
                : "unknown",
            })
          } catch {
            console.warn("[auth-bridge] could not decode token payload")
          }
        } else {
          console.warn("[auth-bridge] getAccessToken returned null/undefined")
        }
        return token
      } catch (err) {
        console.error("[auth-bridge] getAccessToken threw:", err)
        return null
      }
    },
    [getAccessToken, ready, authenticated],
  )

  console.log("[auth-bridge] useAuthFromPrivy state:", { ready, authenticated })

  return useMemo(
    () => ({
      isLoading: !ready,
      isAuthenticated: authenticated,
      fetchAccessToken,
    }),
    [ready, authenticated, fetchAccessToken],
  )
}

export default function ConvexClientProvider({ children }) {
  return (
    <PrivyProvider
      appId={import.meta.env.VITE_PRIVY_APP_ID}
      config={{
        appearance: {
          theme: "dark",
        },
        loginMethods: ["email", "wallet"],
      }}
    >
      <ConvexProviderWithAuth client={convex} useAuth={useAuthFromPrivy}>
        {children}
      </ConvexProviderWithAuth>
    </PrivyProvider>
  )
}
