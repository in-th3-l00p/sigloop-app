const ETHERSCAN_BASE = {
  sepolia: "https://sepolia.etherscan.io",
}

export function getExplorerTxUrl(chain, hash) {
  const base = ETHERSCAN_BASE[chain] ?? ETHERSCAN_BASE.sepolia
  return `${base}/tx/${hash}`
}
