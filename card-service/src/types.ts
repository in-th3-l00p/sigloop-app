export type PolicyType = "allowedContract" | "maxPerTx" | "allowedRecipient"
export type TxStatus = "progress" | "success" | "error"

export interface CardPolicy {
  type: PolicyType
  value: string
}

export interface RuntimeCard {
  id: string
  accountId: string
  name: string
  status: "active" | "paused"
  chain: string
  balanceAddress: string
  spent: string
  limit?: string
  limitResetPeriod?: "daily" | "weekly" | "monthly"
  limitResetAt?: number
  policies: CardPolicy[]
  createdAt: number
}

export interface RuntimeAccount {
  id: string
  address: string
  privateKey: string
  chain: string
}

export interface CardRuntimeContext {
  card: RuntimeCard
  account: RuntimeAccount
}

export interface CardTransaction {
  id: string
  hash: string
  from: string
  to: string
  value: string
  direction: string
  status: TxStatus
  chain: string
  createdAt: number
}

export interface CreateTransactionInput {
  to: string
  value: string
  description?: string
}

export interface CardStore {
  getRuntimeBySecret(secret: string): Promise<CardRuntimeContext | null>
  listTransactions(secret: string, limit?: number): Promise<CardTransaction[]>
  prepareTransactionBySecret(secret: string, input: {
    to: string
    value: string
    idempotencyKey: string
  }): Promise<{ mode: "existing" | "reserved"; txId: string; hash: string; status: TxStatus }>
  finalizePreparedTransactionBySecret(secret: string, input: {
    txId: string
    hash: string
    status: TxStatus
  }): Promise<void>
  saveTransactionBySecret(secret: string, tx: {
    hash: string
    from: string
    to: string
    value: string
    direction: string
    status: TxStatus
    chain: string
    description?: string
  }): Promise<{ txId: string }>
  setCardTransactionStatus(secret: string, hash: string, status: TxStatus): Promise<void>
  setCardStatus(secret: string, status: "active" | "paused"): Promise<{ status: "active" | "paused" }>
}

export interface ChainGateway {
  getBalance(chainSlug: string, address: string): Promise<string>
  sendTransaction(params: {
    chainSlug: string
    privateKey: string
    to: string
    value: string
  }): Promise<{ hash: string; status: "progress" | "success" }>
  waitForFinalStatus(params: {
    chainSlug: string
    privateKey: string
    hash: string
    timeoutMs?: number
  }): Promise<{ status: "success" | "error"; finalHash?: string }>
}
