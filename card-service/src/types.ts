export type PolicyType = "allowedContract" | "maxPerTx" | "allowedRecipient"

export interface CardPolicy {
  type: PolicyType
  value: string
}

export interface Card {
  id: string
  accountId: string
  secret: string
  name: string
  status: "active" | "paused"
  chain: string
  currency: string
  balance: string
  spent: string
  limit?: string
  limitResetPeriod?: "daily" | "weekly" | "monthly"
  limitResetAt?: number
  policies: CardPolicy[]
  createdAt: number
  updatedAt: number
}

export interface CardTransaction {
  id: string
  cardId: string
  hash: string
  from: string
  to: string
  value: string
  chain: string
  status: "pending" | "confirmed" | "failed"
  direction: "in" | "out"
  description?: string
  createdAt: number
}

export interface CreateTransactionInput {
  to: string
  value: string
  description?: string
}
