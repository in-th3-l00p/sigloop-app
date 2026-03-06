import { ConvexHttpClient } from "convex/browser";
import { ApiError } from "../lib/errors.js";
export class ConvexCardStore {
    client;
    constructor(url) {
        this.client = new ConvexHttpClient(url);
    }
    async getRuntimeBySecret(secret) {
        const runtime = await this.client.query("agentCards/service:getRuntimeContextBySecret", { secret });
        if (!runtime) {
            return null;
        }
        return {
            card: {
                id: runtime.card._id,
                accountId: runtime.card.accountId,
                name: runtime.card.name,
                status: runtime.card.status,
                chain: runtime.card.chain,
                balanceAddress: runtime.card.balanceAddress,
                spent: runtime.card.spent,
                limit: runtime.card.limit,
                limitResetPeriod: runtime.card.limitResetPeriod,
                limitResetAt: runtime.card.limitResetAt,
                policies: runtime.card.policies ?? [],
                createdAt: runtime.card.createdAt,
            },
            account: {
                id: runtime.account._id,
                address: runtime.account.address,
                privateKey: runtime.account.privateKey,
                chain: runtime.account.chain,
            },
        };
    }
    async listTransactions(secret, limit = 50) {
        const transactions = await this.client.query("agentCards/service:listTransactionsBySecret", {
            secret,
            limit,
        });
        return transactions.map((tx) => ({
            id: tx._id,
            hash: tx.hash,
            from: tx.from,
            to: tx.to,
            value: tx.value,
            direction: tx.direction,
            status: tx.status,
            chain: tx.chain,
            createdAt: tx.createdAt,
        }));
    }
    async prepareTransactionBySecret(secret, input) {
        try {
            const result = await this.client.mutation("agentCards/service:prepareCardTransactionBySecret", {
                secret,
                ...input,
            });
            return result;
        }
        catch (error) {
            const message = error instanceof Error ? error.message : "Failed to prepare transaction";
            if (message.includes("Idempotency key reuse with different payload")) {
                throw new ApiError(409, "IDEMPOTENCY_KEY_CONFLICT", message);
            }
            throw new ApiError(400, "PREPARE_TX_FAILED", message);
        }
    }
    async finalizePreparedTransactionBySecret(secret, input) {
        await this.client.mutation("agentCards/service:finalizePreparedCardTransactionBySecret", {
            secret,
            txId: input.txId,
            hash: input.hash,
            status: input.status,
        });
    }
    async saveTransactionBySecret(secret, tx) {
        try {
            const result = await this.client.mutation("agentCards/service:upsertCardTransactionBySecret", {
                secret,
                ...tx,
            });
            return { txId: result.txId };
        }
        catch (error) {
            throw new ApiError(400, "CONVEX_TX_RECORD_FAILED", error instanceof Error ? error.message : "Failed to record transaction");
        }
    }
    async setCardTransactionStatus(secret, hash, status) {
        await this.client.mutation("agentCards/service:setCardTransactionStatusBySecret", {
            secret,
            hash,
            status,
        });
    }
    async setCardStatus(secret, status) {
        return this.client.mutation("agentCards/service:setCardStatusBySecret", {
            secret,
            status,
        });
    }
}
