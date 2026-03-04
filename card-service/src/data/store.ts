import crypto from "node:crypto"
import { Card, CardTransaction, CreateTransactionInput } from "../types.js"

export interface CardStore {
  getCardBySecret(secret: string): Promise<Card | null>
  listTransactions(cardId: string, limit?: number): Promise<CardTransaction[]>
  addTransaction(card: Card, input: CreateTransactionInput): Promise<CardTransaction>
  saveCard(card: Card): Promise<void>
}

export class InMemoryCardStore implements CardStore {
  private cardsBySecret: Map<string, Card>
  private transactionsByCard: Map<string, CardTransaction[]>

  constructor(seedCards: Card[] = []) {
    this.cardsBySecret = new Map(seedCards.map((card) => [card.secret, card]))
    this.transactionsByCard = new Map()
  }

  async getCardBySecret(secret: string): Promise<Card | null> {
    return this.cardsBySecret.get(secret) ?? null
  }

  async listTransactions(cardId: string, limit = 50): Promise<CardTransaction[]> {
    return (this.transactionsByCard.get(cardId) ?? []).slice(0, limit)
  }

  async addTransaction(card: Card, input: CreateTransactionInput): Promise<CardTransaction> {
    const tx: CardTransaction = {
      id: `tx_${crypto.randomUUID()}`,
      cardId: card.id,
      hash: `0x${crypto.randomBytes(32).toString("hex")}`,
      from: card.accountId,
      to: input.to,
      value: input.value,
      chain: card.chain,
      status: "confirmed",
      direction: "out",
      description: input.description,
      createdAt: Date.now(),
    }

    const cardTxs = this.transactionsByCard.get(card.id) ?? []
    this.transactionsByCard.set(card.id, [tx, ...cardTxs])

    const spent = BigInt(card.spent || "0") + BigInt(input.value)
    card.spent = spent.toString()
    card.balance = (BigInt(card.balance) - BigInt(input.value)).toString()
    card.updatedAt = Date.now()
    this.cardsBySecret.set(card.secret, card)

    return tx
  }

  async saveCard(card: Card): Promise<void> {
    this.cardsBySecret.set(card.secret, card)
  }
}

export function createSeedStore(): CardStore {
  const now = Date.now()
  return new InMemoryCardStore([
    {
      id: "card_demo_1",
      accountId: "0xA11cE00000000000000000000000000000000001",
      secret: "sgl_demo_secret_123",
      name: "Trading Bot",
      status: "active",
      chain: "base-sepolia",
      currency: "ETH",
      balance: "3000000000000000000",
      spent: "200000000000000000",
      limit: "2000000000000000000",
      limitResetPeriod: "monthly",
      limitResetAt: now + 1000 * 60 * 60 * 24 * 7,
      policies: [
        { type: "maxPerTx", value: "500000000000000000" },
        { type: "allowedRecipient", value: "0xBEEF000000000000000000000000000000000001" },
      ],
      createdAt: now,
      updatedAt: now,
    },
  ])
}
