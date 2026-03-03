import { sepolia } from "viem/chains"

const CHAIN_CONFIG = {
  ethereum: { displayName: "Ethereum" },
  base: { displayName: "Base" },
  polygon: { displayName: "Polygon" },
  arbitrum: { displayName: "Arbitrum" },
  optimism: { displayName: "Optimism" },
}

export function getChainDisplayName(chainSlug) {
  return CHAIN_CONFIG[chainSlug]?.displayName ?? chainSlug
}

export function getZeroDevChain() {
  return sepolia
}

export function getZeroDevRpcUrl() {
  return "https://rpc.zerodev.app/api/v3/00f42aaa-bd75-486b-ad15-851fd20d6177/chain/11155111"
}
