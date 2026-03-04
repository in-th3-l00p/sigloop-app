import type { MiddlewareHandler } from "hono"
import type { ApiStore, ApiKeyContext } from "../types.js"
import { ApiError } from "./errors.js"

declare module "hono" {
  interface ContextVariableMap {
    apiKey: string
    apiAuth: ApiKeyContext
  }
}

export function apiKeyAuth(store: ApiStore): MiddlewareHandler {
  return async (c, next) => {
    const apiKey = c.req.header("x-api-key")
    if (!apiKey) {
      throw new ApiError(401, "MISSING_API_KEY", "Missing x-api-key header")
    }

    const auth = await store.authenticateApiKey(apiKey)
    if (!auth) {
      throw new ApiError(401, "INVALID_API_KEY", "Invalid or revoked API key")
    }

    c.set("apiKey", apiKey)
    c.set("apiAuth", auth)
    await next()
  }
}
