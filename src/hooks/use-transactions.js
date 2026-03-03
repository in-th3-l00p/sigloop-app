import { useState, useEffect, useCallback } from "react"
import { fetchTransactions } from "@/lib/etherscan"
import { getPublicClient } from "@/lib/viem-client"

export function useTransactions(address, chainSlug) {
  const [transactions, setTransactions] = useState([])
  const [isLoading, setIsLoading] = useState(true)

  const refetch = useCallback(async () => {
    if (!address || !chainSlug) return
    try {
      const txs = await fetchTransactions(address, chainSlug)
      setTransactions(txs)
    } catch {
      // keep existing transactions on error
    } finally {
      setIsLoading(false)
    }
  }, [address, chainSlug])

  useEffect(() => {
    if (!address || !chainSlug) return

    let unwatch

    refetch()

    try {
      const client = getPublicClient(chainSlug)
      unwatch = client.watchBlockNumber({
        onBlockNumber: () => refetch(),
        pollingInterval: 15000,
      })
    } catch {
      // fallback: no live updates
    }

    return () => {
      if (unwatch) unwatch()
    }
  }, [address, chainSlug, refetch])

  return { transactions, isLoading, refetch }
}
