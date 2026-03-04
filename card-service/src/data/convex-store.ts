import { ConvexHttpClient } from "convex/browser"
import type {
  CardRuntimeContext,
  CardStore,
  CardTransaction,
} from "../types.js"
import { ApiError } from "../lib/errors.js"

interface ConvexRuntimeResponse {
  card: {
    _id: string
    accountId: string
    name: string
    status: "active" | "paused"
    chain: string
    balanceAddress: string
    spent: string
    limit?: string
    limitResetPeriod?: "daily" | "weekly" | "monthly"
    limitResetAt?: number
    policies?: Array<{ type: "allowedContract" | "maxPerTx" | "allowedRecipient"; value: string }>
    createdAt: number
  }
  account: {
    _id: string
    address: string
    privateKey: string
    chain: string
  }
}

interface ConvexTx {
  _id: string
  hash: string
  from: string
  to: string
  value: string
  direction: string
  status: string
  chain: string
  createdAt: number
}

export class ConvexCardStore implements CardStore {
  private client: ConvexHttpClient

  constructor(url: string) {
    this.client = new ConvexHttpClient(url)
  }

  async getRuntimeBySecret(secret: string): Promise<CardRuntimeContext | null> {
    const runtime = await this.client.query("agentCards/service:getRuntimeContextBySecret" as any, { secret }) as ConvexRuntimeResponse | null
    if (!runtime) {
      return null
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
    }
  }

  async listTransactions(secret: string, limit = 50): Promise<CardTransaction[]> {
    const transactions = await this.client.query("agentCards/service:listTransactionsBySecret" as any, {
      secret,
      limit,
    }) as ConvexTx[]

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
    }))
  }

  async saveTransactionBySecret(secret: string, tx: {
    hash: string
    from: string
    to: string
    value: string
    direction: string
    status: string
    chain: string
    description?: string
  }): Promise<{ txId: string }> {
    try {
      const result = await this.client.mutation("agentCards/service:upsertCardTransactionBySecret" as any, {
        secret,
        ...tx,
      }) as { txId: string }

      return { txId: result.txId }
    } catch (error) {
      throw new ApiError(400, "CONVEX_TX_RECORD_FAILED", error instanceof Error ? error.message : "Failed to record transaction")
    }
  }

  async setCardStatus(secret: string, status: "active" | "paused"): Promise<{ status: "active" | "paused" }> {
    return this.client.mutation("agentCards/service:setCardStatusBySecret" as any, {
      secret,
      status,
    }) as Promise<{ status: "active" | "paused" }>
  }
}
