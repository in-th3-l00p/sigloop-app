const ETHERSCAN_ENDPOINTS = {
  sepolia: "https://api-sepolia.etherscan.io/api",
}

export async function fetchTransactions(address, chainSlug) {
  const baseUrl = ETHERSCAN_ENDPOINTS[chainSlug]
  if (!baseUrl) {
    throw new Error(`No Etherscan endpoint for chain: ${chainSlug}`)
  }

  const apiKey = import.meta.env.VITE_ETHERSCAN_API_KEY ?? ""
  const params = new URLSearchParams({
    module: "account",
    action: "txlist",
    address,
    sort: "desc",
    apikey: apiKey,
  })

  const res = await fetch(`${baseUrl}?${params}`)
  const data = await res.json()

  if (data.status !== "1" || !Array.isArray(data.result)) {
    return []
  }

  return data.result.map((tx) => ({
    hash: tx.hash,
    from: tx.from,
    to: tx.to,
    value: tx.value,
    timestamp: Number(tx.timeStamp) * 1000,
    status: tx.txreceipt_status === "1" ? "success" : "failed",
    blockNumber: Number(tx.blockNumber),
  }))
}
