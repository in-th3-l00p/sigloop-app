import {
  CardClientOptions,
  CardProfile,
  CardBalance,
  CardLimits,
  CardPolicy,
  CardSummary,
  CardTransaction,
  CreateTransactionInput,
  CreateTransactionOptions,
  ListTransactionsQuery,
  QuoteTransactionInput,
  QuoteTransactionResponse,
  RequestContext,
} from "./types"
import { CardApiError, CardNetworkError, CardTimeoutError } from "./errors"

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

export class CardClient {
  private readonly baseUrl: string
  private readonly cardSecret?: string
  private readonly timeoutMs: number
  private readonly fetchImpl: typeof fetch
  private readonly headers?: Record<string, string>
  private readonly idempotencyKeyFactory: () => string
  private readonly beforeRequest?: CardClientOptions["beforeRequest"]
  private readonly afterResponse?: CardClientOptions["afterResponse"]

  constructor(options: CardClientOptions) {
    if (!options.baseUrl) throw new Error("baseUrl is required")

    this.baseUrl = normalizeBaseUrl(options.baseUrl)
    this.cardSecret = options.cardSecret
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
      query?: Record<string, string | number | undefined>
      body?: unknown
      headers?: Record<string, string>
      timeoutMs?: number
      requireSecret?: boolean
    },
  ): Promise<T> {
    const query = options?.query
      ? `?${new URLSearchParams(
          Object.entries(options.query)
            .filter(([, value]) => value !== undefined)
            .map(([key, value]) => [key, String(value)]),
        )}`
      : ""

    const url = `${this.baseUrl}${path}${query}`
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), options?.timeoutMs ?? this.timeoutMs)

    const headers = mergeHeaders(this.headers, options?.headers)
    if (options?.body !== undefined) {
      headers.set("content-type", "application/json")
    }
    if (options?.requireSecret !== false) {
      if (!this.cardSecret) {
        clearTimeout(timeout)
        throw new CardApiError("cardSecret is required for this endpoint", 400, "MISSING_CARD_SECRET")
      }
      headers.set("x-card-secret", this.cardSecret)
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
        throw new CardApiError(
          payload?.error?.message ?? `Request failed with status ${response.status}`,
          response.status,
          payload?.error?.code,
          json,
        )
      }

      return (json as T) ?? ({} as T)
    } catch (error) {
      if (error instanceof CardApiError) throw error
      if (error instanceof DOMException && error.name === "AbortError") {
        throw new CardTimeoutError()
      }
      throw new CardNetworkError(error instanceof Error ? error.message : "Unknown network error")
    } finally {
      clearTimeout(timeout)
    }
  }

  health(): Promise<{ ok: boolean; service: string }> {
    return this.request("GET", "/health", { requireSecret: false })
  }

  openApi(): Promise<unknown> {
    return this.request("GET", "/openapi.json", { requireSecret: false })
  }

  me(): Promise<CardProfile> {
    return this.request("GET", "/v1/card/me")
  }

  balance(): Promise<CardBalance> {
    return this.request("GET", "/v1/card/balance")
  }

  limits(): Promise<CardLimits> {
    return this.request("GET", "/v1/card/limits")
  }

  policies(): Promise<{ policies: CardPolicy[] }> {
    return this.request("GET", "/v1/card/policies")
  }

  summary(): Promise<CardSummary> {
    return this.request("GET", "/v1/card/summary")
  }

  transactions(query: ListTransactionsQuery = {}): Promise<{ transactions: CardTransaction[] }> {
    return this.request("GET", "/v1/card/transactions", {
      query: { limit: query.limit },
    })
  }

  quoteTransaction(input: QuoteTransactionInput): Promise<QuoteTransactionResponse> {
    return this.request("POST", "/v1/card/transactions/quote", {
      body: input,
    })
  }

  createTransaction(
    input: CreateTransactionInput,
    options: CreateTransactionOptions = {},
  ): Promise<{ transaction: CardTransaction; idempotentReplay?: boolean }> {
    const idempotencyKey = options.idempotencyKey ?? this.idempotencyKeyFactory()

    return this.request("POST", "/v1/card/transactions", {
      body: input,
      headers: { "idempotency-key": idempotencyKey },
    })
  }

  pause(): Promise<{ status: "paused" }> {
    return this.request("POST", "/v1/card/pause")
  }

  resume(): Promise<{ status: "active" }> {
    return this.request("POST", "/v1/card/resume")
  }
}

export function createCardClient(options: CardClientOptions): CardClient {
  return new CardClient(options)
}
