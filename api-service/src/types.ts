export type ApiScope = "read" | "write" | "tx" | "admin"

export interface ApiKeyContext {
  apiKeyId: string
  userId: string
  keyName: string
  keyPrefix: string
  scopes: string[]
  ipAllowlist: string[]
  rateLimitPerMinute: number
}

export interface ApiAuthorizationFailure {
  ok: false
  reason: "INSUFFICIENT_SCOPE" | "IP_NOT_ALLOWED" | "RATE_LIMITED" | "PAUSED" | "REVOKED"
}

export interface ApiAuthorizationSuccess extends ApiKeyContext {
  ok: true
}

export interface ApiStore {
  authorizeApiRequest(apiKey: string, requiredScope: ApiScope, ipAddress?: string): Promise<ApiAuthorizationSuccess | ApiAuthorizationFailure | null>
  logRequest(params: {
    apiKey: string
    method: string
    path: string
    statusCode: number
    durationMs: number
    requestId: string
    ipAddress?: string
  }): Promise<void>

  listApiKeys(userId: string): Promise<unknown[]>
  createApiKey(userId: string, input: {
    name: string
    scopes?: string[]
    ipAllowlist?: string[]
    rateLimitPerMinute?: number
  }): Promise<unknown>
  updateApiKeyPolicy(userId: string, apiKeyId: string, input: {
    name?: string
    scopes?: string[]
    ipAllowlist?: string[]
    rateLimitPerMinute?: number
  }): Promise<unknown>
  revokeApiKey(userId: string, apiKeyId: string): Promise<{ ok: boolean }>

  listAccounts(userId: string): Promise<unknown[]>
  getAccount(userId: string, accountId: string): Promise<unknown>
  createAccount(userId: string, input: {
    name: string
    chain: string
    icon: string
    address: string
    privateKey: string
  }): Promise<unknown>
  updateAccount(userId: string, accountId: string, input: { name?: string; icon?: string }): Promise<unknown>
  removeAccount(userId: string, accountId: string): Promise<{ ok: boolean }>
  getAccountWithPrivateKey(userId: string, accountId: string): Promise<{
    _id: string
    address: string
    privateKey: string
    chain: string
  }>

  listContacts(userId: string): Promise<unknown[]>
  createContact(userId: string, input: { name: string; address: string }): Promise<unknown>
  removeContact(userId: string, contactId: string): Promise<{ ok: boolean }>

  listTransactionsByAccount(userId: string, accountId: string): Promise<unknown[]>
  createTransaction(userId: string, input: {
    accountId: string
    idempotencyKey: string
    hash: string
    from: string
    to: string
    value: string
    direction: string
    status: "progress" | "success" | "error"
    chain: string
  }): Promise<unknown>
  updateTransactionStatus(userId: string, transactionId: string, status: "progress" | "success" | "error"): Promise<unknown>

  listCardsByAccount(userId: string, accountId: string): Promise<unknown[]>
  getCard(userId: string, cardId: string): Promise<unknown>
  createCard(userId: string, input: {
    accountId: string
    name: string
    secret: string
    limit?: string
    limitResetPeriod?: string
    policies?: Array<{ type: string; value: string }>
  }): Promise<unknown>
  updateCard(userId: string, cardId: string, input: {
    name?: string
    limit?: string
    status?: string
    limitResetPeriod?: string
    policies?: Array<{ type: string; value: string }>
  }): Promise<unknown>
  removeCard(userId: string, cardId: string): Promise<{ ok: boolean }>
  listCardTransactions(userId: string, cardId: string): Promise<unknown[]>

  listIntegrationsByCard(userId: string, cardId: string): Promise<unknown[]>
  createIntegration(userId: string, input: {
    cardId: string
    presetId: string
    type: string
    platform: string
    name: string
    description: string
    schemaVersion: number
    config?: Record<string, string>
  }): Promise<unknown>
  updateIntegrationConfig(userId: string, integrationId: string, input: { config?: Record<string, string> }): Promise<unknown>
  removeIntegration(userId: string, integrationId: string): Promise<{ ok: boolean }>
}
