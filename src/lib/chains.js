import { sepolia } from "viem/chains"

const ZERODEV_PROJECT_ID = "00f42aaa-bd75-486b-ad15-851fd20d6177"

export const SUPPORTED_CHAINS = [
  { id: "sepolia", name: "Sepolia", chain: sepolia, chainId: 11155111 },
]

const CHAIN_MAP = Object.fromEntries(SUPPORTED_CHAINS.map((c) => [c.id, c]))

export function getChainDisplayName(chainSlug) {
  return CHAIN_MAP[chainSlug]?.name ?? chainSlug
}

export function getChainConfig(chainSlug) {
  const config = CHAIN_MAP[chainSlug]
  if (!config) {
    throw new Error(`Unsupported chain: ${chainSlug}`)
  }
  return {
    chain: config.chain,
    rpcUrl: `https://rpc.zerodev.app/api/v3/${ZERODEV_PROJECT_ID}/chain/${config.chainId}`,
  }
}
