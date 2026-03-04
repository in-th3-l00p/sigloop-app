import { createPublicClient, http } from "viem"
import { getChainConfig } from "./chains"

const clientCache = new Map<string, ReturnType<typeof createPublicClient>>()

export function getPublicClient(chainSlug: string) {
  if (clientCache.has(chainSlug)) {
    return clientCache.get(chainSlug)!
  }

  const { chain, rpcUrl } = getChainConfig(chainSlug)
  const client = createPublicClient({
    chain,
    transport: http(rpcUrl),
  })

  clientCache.set(chainSlug, client)
  return client
}
