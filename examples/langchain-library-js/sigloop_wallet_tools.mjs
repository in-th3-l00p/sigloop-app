import { z } from "zod"
import { tool } from "@langchain/core/tools"

export function createSigloopWalletTools({
  baseUrl = "http://localhost:8787",
  cardSecret = "",
  timeoutMs = 30000,
} = {}) {
  const request = async (method, path, { body, params, extraHeaders } = {}) => {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), timeoutMs)
    try {
      const query = params ? `?${new URLSearchParams(params).toString()}` : ""
      const res = await fetch(`${baseUrl}${path}${query}`, {
        method,
        headers: {
          "x-card-secret": cardSecret,
          "content-type": "application/json",
          ...(extraHeaders || {}),
        },
        body: body ? JSON.stringify(body) : undefined,
        signal: controller.signal,
      })
      if (!res.ok) throw new Error(await res.text())
      const text = await res.text()
      return text || "{}"
    } finally {
      clearTimeout(timer)
    }
  }

  const cardMe = tool(async () => request("GET", "/v1/card/me"), {
    name: "card_me",
    description: "Get wallet metadata.",
    schema: z.object({}),
  })
  const cardBalance = tool(async () => request("GET", "/v1/card/balance"), {
    name: "card_balance",
    description: "Get wallet balance.",
    schema: z.object({}),
  })
  const cardLimits = tool(async () => request("GET", "/v1/card/limits"), {
    name: "card_limits",
    description: "Get wallet limits.",
    schema: z.object({}),
  })
  const cardPolicies = tool(async () => request("GET", "/v1/card/policies"), {
    name: "card_policies",
    description: "Get wallet policies.",
    schema: z.object({}),
  })
  const cardSummary = tool(async () => request("GET", "/v1/card/summary"), {
    name: "card_summary",
    description: "Get wallet summary.",
    schema: z.object({}),
  })
  const cardTransactions = tool(async ({ limit = 10 }) => request("GET", "/v1/card/transactions", { params: { limit: String(limit) } }), {
    name: "card_transactions",
    description: "List wallet transactions.",
    schema: z.object({ limit: z.number().int().positive().max(50).default(10) }),
  })
  const cardQuoteTransaction = tool(async ({ to, valueWei, description }) => request("POST", "/v1/card/transactions/quote", {
    body: { to, value: valueWei, ...(description ? { description } : {}) },
  }), {
    name: "card_quote_transaction",
    description: "Quote a wallet transaction.",
    schema: z.object({ to: z.string(), valueWei: z.string(), description: z.string().optional() }),
  })
  const cardSendTransaction = tool(async ({ to, valueWei, description }) => request("POST", "/v1/card/transactions", {
    body: { to, value: valueWei, ...(description ? { description } : {}) },
    extraHeaders: { "idempotency-key": `langchain-js-${crypto.randomUUID()}` },
  }), {
    name: "card_send_transaction",
    description: "Execute a wallet transaction.",
    schema: z.object({ to: z.string(), valueWei: z.string(), description: z.string().optional() }),
  })
  const cardPause = tool(async () => request("POST", "/v1/card/pause"), {
    name: "card_pause",
    description: "Pause wallet operations.",
    schema: z.object({}),
  })
  const cardResume = tool(async () => request("POST", "/v1/card/resume"), {
    name: "card_resume",
    description: "Resume wallet operations.",
    schema: z.object({}),
  })

  return [
    cardMe,
    cardBalance,
    cardLimits,
    cardPolicies,
    cardSummary,
    cardTransactions,
    cardQuoteTransaction,
    cardSendTransaction,
    cardPause,
    cardResume,
  ]
}
