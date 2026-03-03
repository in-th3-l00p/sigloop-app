import { useCallback, useMemo } from "react"
import { ConvexProviderWithAuth, ConvexReactClient } from "convex/react"
import { PrivyProvider, usePrivy } from "@privy-io/react-auth"

const convex = new ConvexReactClient(import.meta.env.VITE_CONVEX_URL)

function useAuthFromPrivy() {
  const { ready, authenticated, getAccessToken } = usePrivy()

  const fetchAccessToken = useCallback(
    async ({ forceRefreshToken }) => {
      try {
        const token = await getAccessToken()
        return token
      } catch {
        return null
      }
    },
    [getAccessToken],
  )

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
