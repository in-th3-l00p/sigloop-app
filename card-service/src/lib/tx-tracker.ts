import type { CardStore, ChainGateway } from "../types.js"

export async function trackProgressTransaction(params: {
  store: CardStore
  chainGateway: ChainGateway
  secret: string
  txId: string
  hash: string
  chainSlug: string
  privateKey: string
  timeoutMs?: number
}) {
  const result = await params.chainGateway.waitForFinalStatus({
    chainSlug: params.chainSlug,
    privateKey: params.privateKey,
    hash: params.hash,
    timeoutMs: params.timeoutMs,
  })

  await params.store.finalizePreparedTransactionBySecret(params.secret, {
    txId: params.txId,
    hash: result.finalHash ?? params.hash,
    status: result.status,
  })
}
