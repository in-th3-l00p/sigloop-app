import { waitForUserOpFinality } from "@/lib/zerodev"

export async function finalizeProgressTransaction({
  chainSlug,
  privateKey,
  txHash,
  retryWindowMs = 120000,
}) {
  return waitForUserOpFinality({
    chainSlug,
    privateKey,
    txHash,
    timeoutMs: retryWindowMs,
  })
}
