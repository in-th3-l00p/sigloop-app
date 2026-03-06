import {
  ApiAuthContext,
  ApiClientOptions,
  ApiKey,
  Card,
  Contact,
  CreateAccountInput,
  CreateApiKeyInput,
  CreateCardInput,
  CreateContactInput,
  CreateIntegrationInput,
  ProvisionAccountInput,
  RequestContext,
  SendTransactionInput,
  SendTransactionOptions,
  SmartAccount,
  Transaction,
  Integration,
  UpdateAccountInput,
  UpdateApiKeyPolicyInput,
  UpdateCardInput,
  UpdateIntegrationInput,
} from "./types"
import { ApiApiError, ApiNetworkError, ApiTimeoutError } from "./errors"

function normalizeBaseUrl(url: string): string {
  return url.replace(/\/+$/, "")
}

function createDefaultIdempotencyKey(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return `sdk_${crypto.randomUUID()}`
  }
  return `sdk_${Date.now()}_${Math.random().toString(36).slice(2)}`
}

function mergeHeaders(...sets: Array<Record<string, string> | undefined>): Headers {
  const headers = new Headers()
  for (const set of sets) {
    if (!set) continue
    for (const [k, v] of Object.entries(set)) {
      if (v !== undefined) headers.set(k, v)
    }
  }
  return headers
}

async function readJsonSafe(response: Response): Promise<unknown> {
  const contentType = response.headers.get("content-type") ?? ""
  if (!contentType.toLowerCase().includes("application/json")) {
    return undefined
  }
  try {
    return await response.json()
  } catch {
    return undefined
  }
}

export class ApiClient {
  private readonly baseUrl: string
  private readonly apiKey?: string
  private readonly timeoutMs: number
  private readonly fetchImpl: typeof fetch
  private readonly headers?: Record<string, string>
  private readonly idempotencyKeyFactory: () => string
  private readonly beforeRequest?: ApiClientOptions["beforeRequest"]
  private readonly afterResponse?: ApiClientOptions["afterResponse"]

  constructor(options: ApiClientOptions) {
    if (!options.baseUrl) throw new Error("baseUrl is required")

    this.baseUrl = normalizeBaseUrl(options.baseUrl)
    this.apiKey = options.apiKey
    this.timeoutMs = options.timeoutMs ?? 15000
    this.fetchImpl = options.fetch ?? fetch
    this.headers = options.headers
    this.idempotencyKeyFactory = options.idempotencyKeyFactory ?? createDefaultIdempotencyKey
    this.beforeRequest = options.beforeRequest
    this.afterResponse = options.afterResponse
  }

  private async request<T>(
    method: string,
    path: string,
    options?: {
      body?: unknown
      headers?: Record<string, string>
      timeoutMs?: number
      requireApiKey?: boolean
    },
  ): Promise<T> {
    const url = `${this.baseUrl}${path}`
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), options?.timeoutMs ?? this.timeoutMs)

    const headers = mergeHeaders(this.headers, options?.headers)
    if (options?.body !== undefined) {
      headers.set("content-type", "application/json")
    }
    if (options?.requireApiKey !== false) {
      if (!this.apiKey) {
        clearTimeout(timeout)
        throw new ApiApiError("apiKey is required for this endpoint", 400, "MISSING_API_KEY")
      }
      headers.set("x-api-key", this.apiKey)
    }

    const context: RequestContext = {
      path,
      method,
      url,
      headers,
    }

    try {
      await this.beforeRequest?.(context)
      const response = await this.fetchImpl(url, {
        method,
        headers,
        body: options?.body !== undefined ? JSON.stringify(options.body) : undefined,
        signal: controller.signal,
      })
      await this.afterResponse?.(context, response)

      const json = await readJsonSafe(response)
      if (!response.ok) {
        const payload = json as { error?: { code?: string; message?: string } } | undefined
        throw new ApiApiError(
          payload?.error?.message ?? `Request failed with status ${response.status}`,
          response.status,
          payload?.error?.code,
          json,
        )
      }

      return (json as T) ?? ({} as T)
    } catch (error) {
      if (error instanceof ApiApiError) throw error
      if (error instanceof DOMException && error.name === "AbortError") {
        throw new ApiTimeoutError()
      }
      throw new ApiNetworkError(error instanceof Error ? error.message : "Unknown network error")
    } finally {
      clearTimeout(timeout)
    }
  }

  health(): Promise<{ ok: boolean; service: string }> {
    return this.request("GET", "/health", { requireApiKey: false })
  }

  openApi(): Promise<unknown> {
    return this.request("GET", "/openapi.json", { requireApiKey: false })
  }

  me(): Promise<ApiAuthContext> {
    return this.request("GET", "/v1/me")
  }

  listApiKeys(): Promise<{ apiKeys: ApiKey[] }> {
    return this.request("GET", "/v1/api-keys")
  }

  createApiKey(input: CreateApiKeyInput): Promise<{ apiKey: ApiKey }> {
    return this.request("POST", "/v1/api-keys", { body: input })
  }

  updateApiKeyPolicy(apiKeyId: string, input: UpdateApiKeyPolicyInput): Promise<{ apiKey: ApiKey }> {
    return this.request("PATCH", `/v1/api-keys/${apiKeyId}`, { body: input })
  }

  revokeApiKey(apiKeyId: string): Promise<{ ok: boolean }> {
    return this.request("DELETE", `/v1/api-keys/${apiKeyId}`)
  }

  listAccounts(): Promise<{ accounts: SmartAccount[] }> {
    return this.request("GET", "/v1/accounts")
  }

  createAccount(input: CreateAccountInput): Promise<{ account: SmartAccount }> {
    return this.request("POST", "/v1/accounts", { body: input })
  }

  provisionAccount(input: ProvisionAccountInput): Promise<{ account: SmartAccount }> {
    return this.request("POST", "/v1/accounts/provision", { body: input })
  }

  getAccount(accountId: string): Promise<{ account: SmartAccount }> {
    return this.request("GET", `/v1/accounts/${accountId}`)
  }

  updateAccount(accountId: string, input: UpdateAccountInput): Promise<{ account: SmartAccount }> {
    return this.request("PATCH", `/v1/accounts/${accountId}`, { body: input })
  }

  removeAccount(accountId: string): Promise<{ ok: boolean }> {
    return this.request("DELETE", `/v1/accounts/${accountId}`)
  }

  listAccountTransactions(accountId: string): Promise<{ transactions: Transaction[] }> {
    return this.request("GET", `/v1/accounts/${accountId}/transactions`)
  }

  sendTransaction(
    accountId: string,
    input: SendTransactionInput,
    options: SendTransactionOptions = {},
  ): Promise<{ transaction: Transaction }> {
    const idempotencyKey = options.idempotencyKey ?? this.idempotencyKeyFactory()

    return this.request("POST", `/v1/accounts/${accountId}/transactions`, {
      body: input,
      headers: { "idempotency-key": idempotencyKey },
    })
  }

  listAccountCards(accountId: string): Promise<{ cards: Card[] }> {
    return this.request("GET", `/v1/accounts/${accountId}/cards`)
  }

  createCard(input: CreateCardInput): Promise<{ card: Card }> {
    return this.request("POST", "/v1/cards", { body: input })
  }

  getCard(cardId: string): Promise<{ card: Card }> {
    return this.request("GET", `/v1/cards/${cardId}`)
  }

  updateCard(cardId: string, input: UpdateCardInput): Promise<{ card: Card }> {
    return this.request("PATCH", `/v1/cards/${cardId}`, { body: input })
  }

  removeCard(cardId: string): Promise<{ ok: boolean }> {
    return this.request("DELETE", `/v1/cards/${cardId}`)
  }

  listCardTransactions(cardId: string): Promise<{ transactions: Transaction[] }> {
    return this.request("GET", `/v1/cards/${cardId}/transactions`)
  }

  listCardIntegrations(cardId: string): Promise<{ integrations: Integration[] }> {
    return this.request("GET", `/v1/cards/${cardId}/integrations`)
  }

  createIntegration(input: CreateIntegrationInput): Promise<{ integration: Integration }> {
    return this.request("POST", "/v1/integrations", { body: input })
  }

  updateIntegration(integrationId: string, input: UpdateIntegrationInput): Promise<{ integration: Integration }> {
    return this.request("PATCH", `/v1/integrations/${integrationId}`, { body: input })
  }

  removeIntegration(integrationId: string): Promise<{ ok: boolean }> {
    return this.request("DELETE", `/v1/integrations/${integrationId}`)
  }

  listContacts(): Promise<{ contacts: Contact[] }> {
    return this.request("GET", "/v1/contacts")
  }

  createContact(input: CreateContactInput): Promise<{ contact: Contact }> {
    return this.request("POST", "/v1/contacts", { body: input })
  }

  removeContact(contactId: string): Promise<{ ok: boolean }> {
    return this.request("DELETE", `/v1/contacts/${contactId}`)
  }
}

export function createApiClient(options: ApiClientOptions): ApiClient {
  return new ApiClient(options)
}
