const ETHERSCAN_BASE = {
  sepolia: "https://sepolia.etherscan.io",
} as const

export function getExplorerTxUrl(chain: string, hash: string) {
  const base = ETHERSCAN_BASE[chain as keyof typeof ETHERSCAN_BASE] ?? ETHERSCAN_BASE.sepolia
  return `${base}/tx/${hash}`
}
