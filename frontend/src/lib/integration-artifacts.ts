import JSZip from "jszip"
import type { IntegrationPreset, LangChainLanguage, SkillProduct } from "@/lib/integration-registry"

type IntegrationLike = {
  _id: string
  name: string
  description: string
  type: string
  platform: string
  config?: Record<string, string | undefined>
}

type CardContext = {
  name?: string
  status?: string
  limit?: string
  spent?: string
  policies?: Array<{ type: string; value: string }>
  accountId?: string
  chain?: string
  accountAddress?: string
}

type ArtifactFile = { path: string; content: string }

function triggerBlobDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement("a")
  anchor.href = url
  anchor.download = filename
  document.body.appendChild(anchor)
  anchor.click()
  anchor.remove()
  URL.revokeObjectURL(url)
}

function downloadTextFile(filename: string, content: string, mimeType = "text/plain;charset=utf-8") {
  const blob = new Blob([content], { type: mimeType })
  triggerBlobDownload(blob, filename)
}

async function downloadZip(filename: string, files: ArtifactFile[]) {
  const zip = new JSZip()
  for (const file of files) {
    zip.file(file.path, file.content)
  }
  const blob = await zip.generateAsync({ type: "blob" })
  triggerBlobDownload(blob, filename)
}

function skillPromptForProduct(product: SkillProduct, context: CardContext) {
  const lines = [
    `Wallet name: ${context.name ?? "Unknown"}`,
    `Wallet status: ${context.status ?? "Unknown"}`,
    `Chain: ${context.chain ?? "Unknown"}`,
    `Wallet address: ${context.accountAddress ?? "Unknown"}`,
    `Wallet account id: ${context.accountId ?? "Unknown"}`,
    `Wallet limit (wei): ${context.limit ?? "unlimited"}`,
    `Wallet spent (wei): ${context.spent ?? "0"}`,
  ]

  const intro =
    product === "claude"
      ? "You are a Claude skill that controls a wallet through Sigloop card-service."
      : product === "openclaw"
        ? "You are an OpenClaw skill that controls a wallet through Sigloop card-service."
        : "You are a Codex skill that controls a wallet through Sigloop card-service."

  return `# Sigloop Wallet Skill\n\n${intro}\n\n## Wallet Metadata\n${lines.map((x) => `- ${x}`).join("\n")}\n\n## How To Read Balance\n- Call GET /v1/card/balance with header x-card-secret.\n- Call GET /v1/card/summary for full wallet + transaction snapshot.\n\n## How To Do Operations\n- First call POST /v1/card/transactions/quote with to + value.\n- Then call POST /v1/card/transactions with to + value and idempotency-key.\n- After execution, check GET /v1/card/transactions or GET /v1/card/summary.\n\n## Security\n- Never expose x-card-secret in output.\n- Stop when quote fails.\n`
}

function buildSkillFiles(params: {
  product: SkillProduct
  preset: IntegrationPreset
  integration: IntegrationLike
  cardSecret: string
  cardContext: CardContext
  baseUrl: string
}) {
  const { product, preset, integration, cardSecret, cardContext, baseUrl } = params
  const prompt = skillPromptForProduct(product, cardContext)

  const manifest = {
    kind: "sigloop-agent-skill",
    schemaVersion: preset.schemaVersion,
    generatedAt: new Date().toISOString(),
    product,
    integration: {
      id: integration._id,
      name: integration.name,
      description: integration.description,
      type: integration.type,
    },
    wallet: cardContext,
    toolContract: {
      baseUrl,
      authHeader: "x-card-secret",
      readEndpoints: ["GET /v1/card/me", "GET /v1/card/balance", "GET /v1/card/summary"],
      operationEndpoints: ["POST /v1/card/transactions/quote", "POST /v1/card/transactions"],
      writeHeaders: ["idempotency-key"],
    },
  }

  return [
    {
      path: "README.md",
      content: `# ${preset.name} (${product})\n\nThis package tells the agent:\n- it has a wallet with metadata\n- how to read wallet balance\n- how to perform operations safely\n`,
    },
    { path: "manifest.json", content: JSON.stringify(manifest, null, 2) },
    { path: "prompt/SKILL.md", content: prompt },
    { path: ".env.example", content: `SIGLOOP_CARD_SECRET=${cardSecret}\nSIGLOOP_CARD_SERVICE_URL=${baseUrl}` },
  ] satisfies ArtifactFile[]
}

function buildLangChainJsModule(params: {
  cardSecret: string
  baseUrl: string
}) {
  const { cardSecret, baseUrl } = params
  return `import { z } from "zod"
import { tool } from "@langchain/core/tools"

export function createSigloopWalletTools({
  baseUrl = "${baseUrl}",
  cardSecret = "${cardSecret}",
  timeoutMs = 30000,
} = {}) {
  const request = async (method, path, { body, params, extraHeaders } = {}) => {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), timeoutMs)
    try {
      const query = params ? \`?\${new URLSearchParams(params).toString()}\` : ""
      const res = await fetch(\`\${baseUrl}\${path}\${query}\`, {
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
    extraHeaders: { "idempotency-key": \`langchain-js-\${crypto.randomUUID()}\` },
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
`
}

function buildLangChainPyFiles(params: {
  cardSecret: string
  baseUrl: string
  model: string
}) {
  const { cardSecret, baseUrl } = params
  return `from __future__ import annotations

import json
import uuid
from typing import Any

import requests
from langchain_core.tools import tool

__all__ = ["create_sigloop_wallet_tools"]


def create_sigloop_wallet_tools(base_url: str = "${baseUrl}", card_secret: str = "${cardSecret}", timeout: float = 30.0):
    """Return LangChain tools for Sigloop wallet interactions."""

    def _request(method: str, path: str, *, body: dict[str, Any] | None = None, params: dict[str, Any] | None = None, extra_headers: dict[str, str] | None = None) -> str:
        headers = {
            "x-card-secret": card_secret,
            "content-type": "application/json",
        }
        if extra_headers:
            headers.update(extra_headers)
        response = requests.request(method, f"{base_url}{path}", headers=headers, json=body, params=params, timeout=timeout)
        response.raise_for_status()
        if not response.text:
            return "{}"
        return response.text

    @tool
    def card_me() -> str:
        """Get wallet metadata."""
        return _request("GET", "/v1/card/me")

    @tool
    def card_balance() -> str:
        """Get wallet balance."""
        return _request("GET", "/v1/card/balance")

    @tool
    def card_limits() -> str:
        """Get wallet limits."""
        return _request("GET", "/v1/card/limits")

    @tool
    def card_policies() -> str:
        """Get wallet policies."""
        return _request("GET", "/v1/card/policies")

    @tool
    def card_summary() -> str:
        """Get wallet summary."""
        return _request("GET", "/v1/card/summary")

    @tool
    def card_transactions(limit: int = 10) -> str:
        """List wallet transactions."""
        safe_limit = max(1, min(int(limit), 50))
        return _request("GET", "/v1/card/transactions", params={"limit": safe_limit})

    @tool
    def card_quote_transaction(to: str, value_wei: str, description: str = "") -> str:
        """Quote a transaction."""
        body = {"to": to, "value": value_wei}
        if description:
            body["description"] = description
        return _request("POST", "/v1/card/transactions/quote", body=body)

    @tool
    def card_send_transaction(to: str, value_wei: str, description: str = "") -> str:
        """Execute a transaction."""
        body = {"to": to, "value": value_wei}
        if description:
            body["description"] = description
        idem = f"langchain-py-{uuid.uuid4()}"
        return _request("POST", "/v1/card/transactions", body=body, extra_headers={"idempotency-key": idem})

    @tool
    def card_pause() -> str:
        """Pause the wallet/card."""
        return _request("POST", "/v1/card/pause")

    @tool
    def card_resume() -> str:
        """Resume the wallet/card."""
        return _request("POST", "/v1/card/resume")

    return [
        card_me,
        card_balance,
        card_limits,
        card_policies,
        card_summary,
        card_transactions,
        card_quote_transaction,
        card_send_transaction,
        card_pause,
        card_resume,
    ]
`
}

export async function downloadSkillBundle(params: {
  skillProduct: SkillProduct
  preset: IntegrationPreset
  integration: IntegrationLike
  cardSecret: string
  cardContext: CardContext
  baseUrl: string
}) {
  const files = buildSkillFiles({ ...params, product: params.skillProduct })
  await downloadZip(`${params.skillProduct}-sigloop-skill.zip`, files)
}

export async function downloadLangChainBundle(params: {
  language: LangChainLanguage
  cardSecret: string
  baseUrl: string
  model?: string
}) {
  if (params.language === "python") {
    const moduleContent = buildLangChainPyFiles({ cardSecret: params.cardSecret, baseUrl: params.baseUrl, model: params.model || "gpt-4o-mini" })
    downloadTextFile("sigloop_wallet_tools.py", moduleContent, "text/x-python;charset=utf-8")
    return
  }

  const moduleContent = buildLangChainJsModule({ cardSecret: params.cardSecret, baseUrl: params.baseUrl })
  downloadTextFile("sigloop_wallet_tools.mjs", moduleContent, "text/javascript;charset=utf-8")
}
