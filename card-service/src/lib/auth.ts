import type { MiddlewareHandler } from "hono"
import { ApiError } from "./errors.js"
import type { Card } from "../types.js"
import type { CardStore } from "../data/store.js"

declare module "hono" {
  interface ContextVariableMap {
    card: Card
  }
}

export function cardAuth(store: CardStore): MiddlewareHandler {
  return async (c, next) => {
    const secret = c.req.header("x-card-secret")

    if (!secret) {
      throw new ApiError(401, "MISSING_SECRET", "Missing x-card-secret header")
    }

    const card = await store.getCardBySecret(secret)
    if (!card) {
      throw new ApiError(401, "INVALID_SECRET", "Invalid card secret")
    }

    c.set("card", card)
    await next()
  }
}
