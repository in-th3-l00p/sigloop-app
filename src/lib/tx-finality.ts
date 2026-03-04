import { waitForUserOpFinality } from "@/lib/zerodev"

export async function finalizeProgressTransaction({
  chainSlug,
  privateKey,
  txHash,
  retryWindowMs = 120000,
}: {
  chainSlug: string
  privateKey: `0x${string}`
  txHash: `0x${string}`
  retryWindowMs?: number
}): Promise<"success" | "error"> {
  return waitForUserOpFinality({
    chainSlug,
    privateKey,
    txHash,
    timeoutMs: retryWindowMs,
  })
}
