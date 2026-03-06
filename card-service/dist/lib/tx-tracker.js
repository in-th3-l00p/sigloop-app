export async function trackProgressTransaction(params) {
    const result = await params.chainGateway.waitForFinalStatus({
        chainSlug: params.chainSlug,
        privateKey: params.privateKey,
        hash: params.hash,
        timeoutMs: params.timeoutMs,
    });
    await params.store.finalizePreparedTransactionBySecret(params.secret, {
        txId: params.txId,
        hash: result.finalHash ?? params.hash,
        status: result.status,
    });
}
