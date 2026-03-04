import type { MiddlewareHandler } from "hono"
import { ApiError } from "./errors.js"
import type { CardRuntimeContext, CardStore } from "../types.js"

declare module "hono" {
  interface ContextVariableMap {
    runtime: CardRuntimeContext
    cardSecret: string
  }
}

export function cardAuth(store: CardStore): MiddlewareHandler {
  return async (c, next) => {
    const secret = c.req.header("x-card-secret")

    if (!secret) {
      throw new ApiError(401, "MISSING_SECRET", "Missing x-card-secret header")
    }

    const runtime = await store.getRuntimeBySecret(secret)
    if (!runtime) {
      throw new ApiError(401, "INVALID_SECRET", "Invalid card secret")
    }

    c.set("runtime", runtime)
    c.set("cardSecret", secret)
    await next()
  }
}
