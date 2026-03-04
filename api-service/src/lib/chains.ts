import { baseSepolia, sepolia } from "viem/chains"
import type { Chain } from "viem"

const CHAIN_CONFIG: Record<string, { chain: Chain; rpcUrl: string }> = {
  sepolia: {
    chain: sepolia,
    rpcUrl: process.env.SEPOLIA_RPC_URL ?? "https://rpc.sepolia.org",
  },
  baseSepolia: {
    chain: baseSepolia,
    rpcUrl: process.env.BASE_SEPOLIA_RPC_URL ?? "https://sepolia.base.org",
  },
}

export function getChainConfig(chainSlug: string) {
  const config = CHAIN_CONFIG[chainSlug]
  if (!config) {
    throw new Error(`Unsupported chain: ${chainSlug}`)
  }
  return config
}
