export interface ApiKeyContext {
  apiKeyId: string
  userId: string
  keyName: string
  keyPrefix: string
}

export interface ApiStore {
  authenticateApiKey(apiKey: string): Promise<ApiKeyContext | null>
  logRequest(params: {
    apiKey: string
    method: string
    path: string
    statusCode: number
    durationMs: number
    requestId: string
  }): Promise<void>

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
