import { useState, useEffect } from "react"
import { getPublicClient } from "@/lib/viem-client"

export function useEthBalance(address, chainSlug) {
  const [balance, setBalance] = useState(undefined)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (!address || !chainSlug) return

    let cancelled = false
    const client = getPublicClient(chainSlug)

    async function fetchBalance() {
      try {
        const bal = await client.getBalance({ address })
        if (!cancelled) {
          setBalance(bal)
          setIsLoading(false)
        }
      } catch {
        if (!cancelled) setIsLoading(false)
      }
    }

    fetchBalance()
    const interval = setInterval(fetchBalance, 30000)

    return () => {
      cancelled = true
      clearInterval(interval)
    }
  }, [address, chainSlug])

  return { balance, isLoading }
}
