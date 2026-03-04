import type { MiddlewareHandler } from "hono"
import type { ApiStore, ApiKeyContext, ApiScope } from "../types.js"
import { ApiError } from "./errors.js"

declare module "hono" {
  interface ContextVariableMap {
    apiKey: string
    apiAuth: ApiKeyContext
    clientIp?: string
  }
}

function getClientIp(headers: Headers): string | undefined {
  const forwarded = headers.get("x-forwarded-for")
  if (forwarded) {
    return forwarded.split(",")[0]?.trim()
  }
  return headers.get("cf-connecting-ip") ?? headers.get("x-real-ip") ?? undefined
}

export function apiKeyAuth(store: ApiStore, requiredScope: ApiScope): MiddlewareHandler {
  return async (c, next) => {
    const apiKey = c.req.header("x-api-key")
    if (!apiKey) {
      throw new ApiError(401, "MISSING_API_KEY", "Missing x-api-key header")
    }

    const clientIp = getClientIp(c.req.raw.headers)
    const auth = await store.authorizeApiRequest(apiKey, requiredScope, clientIp)

    if (!auth) {
      throw new ApiError(401, "INVALID_API_KEY", "Invalid or revoked API key")
    }

    if (auth.ok === false) {
      if (auth.reason === "INSUFFICIENT_SCOPE") {
        throw new ApiError(403, "INSUFFICIENT_SCOPE", "API key scope does not allow this operation")
      }
      if (auth.reason === "IP_NOT_ALLOWED") {
        throw new ApiError(403, "IP_NOT_ALLOWED", "Request IP is not in key allowlist")
      }
      if (auth.reason === "RATE_LIMITED") {
        throw new ApiError(429, "RATE_LIMITED", "Rate limit exceeded for this API key")
      }
      throw new ApiError(403, "API_KEY_FORBIDDEN", "API key is not authorized for this request")
    }

    const { ok: _, ...context } = auth
    c.set("apiKey", apiKey)
    c.set("apiAuth", context)
    c.set("clientIp", clientIp)
    await next()
  }
}
