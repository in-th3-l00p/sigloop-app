export type ApiScope = "read" | "write" | "tx" | "admin"
export type ApiKeyStatus = "active" | "paused" | "revoked"
export type TxStatus = "progress" | "success" | "error"

export interface ApiAuthContext {
  ok: true
  apiKeyId: string
  userId: string
  keyName: string
  keyPrefix: string
  scopes: string[]
  ipAllowlist: string[]
  rateLimitPerMinute: number
}

export interface ApiKey {
  _id?: string
  id?: string
  userId?: string
  name: string
  keyPrefix: string
  scopes: string[]
  ipAllowlist?: string[]
  rateLimitPerMinute?: number
  status: ApiKeyStatus
  createdAt?: number
  lastUsedAt?: number
  revokedAt?: number
  apiKey?: string
}

export interface SmartAccount {
  _id: string
  userId?: string
  name: string
  chain: string
  icon: string
  address: string
  status?: string
  createdAt: number
}

export interface Transaction {
  _id?: string
  userId?: string
  accountId?: string
  agentCardId?: string
  idempotencyKey?: string
  hash: string
  from: string
  to: string
  value: string
  direction: string
  status: TxStatus
  chain: string
  createdAt?: number
}

export interface CardPolicy {
  type: string
  value: string
}

export interface Card {
  _id: string
  userId?: string
  accountId: string
  name: string
  secret: string
  limit?: string
  spent: string
  status: string
  limitResetPeriod?: string
  limitResetAt?: number
  policies?: CardPolicy[]
  createdAt: number
}

export interface IntegrationConfig {
  secretRef?: string
  language?: string
  packageManager?: string
  endpointBaseUrl?: string
  toolLibrary?: string
  agentPurpose?: string
  taskScope?: string
  behavioralRules?: string
  escalationPolicy?: string
  [key: string]: string | undefined
}

export interface Integration {
  _id: string
  userId?: string
  cardId: string
  presetId: string
  type: string
  platform: string
  name: string
  description: string
  status: string
  schemaVersion: number
  verificationMessage?: string
  verifiedAt?: number
  config?: IntegrationConfig
  createdAt: number
  updatedAt: number
}

export interface Contact {
  _id: string
  userId?: string
  name: string
  address: string
}

export interface CreateApiKeyInput {
  name: string
  scopes?: ApiScope[]
  ipAllowlist?: string[]
  rateLimitPerMinute?: number
}

export interface UpdateApiKeyPolicyInput {
  name?: string
  scopes?: ApiScope[]
  ipAllowlist?: string[]
  rateLimitPerMinute?: number
}

export interface CreateAccountInput {
  name: string
  chain: string
  icon: string
  address: string
  privateKey: string
}

export interface ProvisionAccountInput {
  name: string
  chain: string
  icon?: string
}

export interface UpdateAccountInput {
  name?: string
  icon?: string
}

export interface SendTransactionInput {
  to: string
  value: string
}

export interface SendTransactionOptions {
  idempotencyKey?: string
}

export interface CreateCardInput {
  accountId: string
  name: string
  secret: string
  limit?: string
  limitResetPeriod?: string
  policies?: CardPolicy[]
}

export interface UpdateCardInput {
  name?: string
  limit?: string
  status?: string
  limitResetPeriod?: string
  policies?: CardPolicy[]
}

export interface CreateIntegrationInput {
  cardId: string
  presetId: string
  type: string
  platform: string
  name: string
  description: string
  schemaVersion: number
  config?: IntegrationConfig
}

export interface UpdateIntegrationInput {
  config?: IntegrationConfig
}

export interface CreateContactInput {
  name: string
  address: string
}

export interface RequestContext {
  path: string
  method: string
  url: string
  headers: Headers
}

export interface ApiClientOptions {
  baseUrl: string
  apiKey?: string
  timeoutMs?: number
  fetch?: typeof fetch
  headers?: Record<string, string>
  idempotencyKeyFactory?: () => string
  beforeRequest?: (context: RequestContext) => void | Promise<void>
  afterResponse?: (context: RequestContext, response: Response) => void | Promise<void>
}
