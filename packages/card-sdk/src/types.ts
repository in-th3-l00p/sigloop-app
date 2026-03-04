export type CardStatus = "active" | "paused"
export type TransactionStatus = "progress" | "success" | "error"

export interface CardPolicy {
  type: string
  value: string
}

export interface CardTransaction {
  id?: string
  hash: string
  from: string
  to: string
  value: string
  direction: "in" | "out" | string
  status: TransactionStatus
  chain: string
  createdAt?: number
  description?: string
}

export interface CardProfile {
  id: string
  accountId: string
  accountAddress: string
  name: string
  status: CardStatus
  chain: string
  createdAt: number
}

export interface CardBalance {
  balance: string
  currency: string
  chain: string
  spent: string
}

export interface CardLimits {
  limit: string | null
  spent: string
  remaining: string | null
  resetPeriod: string | null
  resetAt: number | null
}

export interface CardSummary {
  card: {
    id: string
    name: string
    status: CardStatus
  }
  balance: string
  limit: string | null
  spent: string
  recentTransactions: CardTransaction[]
}

export interface QuoteTransactionInput {
  to: string
  value: string
  description?: string
}

export interface QuoteTransactionResponse {
  allowed: boolean
  quote: {
    amount: string
    networkFee: string
    total: string
  }
}

export interface CreateTransactionInput {
  to: string
  value: string
  description?: string
}

export interface CreateTransactionOptions {
  idempotencyKey?: string
}

export interface ListTransactionsQuery {
  limit?: number
}

export interface RequestContext {
  path: string
  method: string
  url: string
  headers: Headers
}

export interface CardClientOptions {
  baseUrl: string
  cardSecret?: string
  timeoutMs?: number
  fetch?: typeof fetch
  headers?: Record<string, string>
  idempotencyKeyFactory?: () => string
  beforeRequest?: (context: RequestContext) => void | Promise<void>
  afterResponse?: (context: RequestContext, response: Response) => void | Promise<void>
}
