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

type CardPolicy = { type: string; value: string }

type CardContext = {
  name?: string
  status?: string
  limit?: string
  spent?: string
  policies?: CardPolicy[]
  accountId?: string
  chain?: string
  accountAddress?: string
  agentPurpose?: string
  taskScope?: string
  behavioralRules?: string
  escalationPolicy?: string
}

type ArtifactFile = { path: string; content: string }
type SkillArtifactPayload = {
  version: 1
  product: SkillProduct
  publicUrl: string
  publishedAt: string
  wallet: CardContext
  apiBaseUrl: string
  bootstrapPrompt: string
  files: ArtifactFile[]
}

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

async function downloadZip(filename: string, files: ArtifactFile[]) {
  const zip = new JSZip()
  for (const file of files) {
    zip.file(file.path, file.content)
  }
  const blob = await zip.generateAsync({ type: "blob" })
  triggerBlobDownload(blob, filename)
}

function formatPolicies(policies: CardPolicy[] = []) {
  if (!policies.length) return "- No extra policies configured."
  return policies.map((policy) => `- ${policy.type}: ${policy.value}`).join("\n")
}

function buildWalletSnapshot(cardContext: CardContext) {
  return [
    `- Card name: ${cardContext.name ?? "Unknown"}`,
    `- Card status: ${cardContext.status ?? "Unknown"}`,
    `- Chain: ${cardContext.chain ?? "Unknown"}`,
    `- Account address: ${cardContext.accountAddress ?? "Unknown"}`,
    `- Account id: ${cardContext.accountId ?? "Unknown"}`,
    `- Spending limit (wei): ${cardContext.limit ?? "unlimited"}`,
    `- Spent so far (wei): ${cardContext.spent ?? "0"}`,
    `- Agent purpose: ${cardContext.agentPurpose ?? "Not set"}`,
    `- Task scope: ${cardContext.taskScope ?? "Not set"}`,
    `- Behavioral rules: ${cardContext.behavioralRules ?? "Not set"}`,
    `- Escalation policy: ${cardContext.escalationPolicy ?? "Not set"}`,
  ].join("\n")
}

function buildCardServiceReference(baseUrl: string) {
  return [
    `Base URL: ${baseUrl}`,
    "Auth header: x-card-secret: <card secret>",
    "Required write header: idempotency-key: <unique value per transfer intent>",
    "",
    "Read endpoints:",
    `- GET ${baseUrl}/v1/card/me`,
    `- GET ${baseUrl}/v1/card/balance`,
    `- GET ${baseUrl}/v1/card/limits`,
    `- GET ${baseUrl}/v1/card/policies`,
    `- GET ${baseUrl}/v1/card/summary`,
    `- GET ${baseUrl}/v1/card/transactions?limit=20`,
    "",
    "Write endpoints:",
    `- POST ${baseUrl}/v1/card/transactions/quote`,
    `- POST ${baseUrl}/v1/card/transactions`,
    `- POST ${baseUrl}/v1/card/pause`,
    `- POST ${baseUrl}/v1/card/resume`,
  ].join("\n")
}

function buildOperationalRules(baseUrl: string) {
  return [
    "1. Before any spending decision, inspect both limits and policies.",
    `2. Use GET ${baseUrl}/v1/card/limits and GET ${baseUrl}/v1/card/policies before proposing or executing a transfer.`,
    "3. For a transfer, first request a quote and stop if the quote or policy validation fails.",
    "4. When executing a transfer, always send a fresh idempotency-key so retries do not duplicate payment intent.",
    "5. Never reveal the card secret in logs, model output, screenshots, or tool traces.",
    "6. If the card status is paused, do not attempt a payment until the operator explicitly asks for resume.",
    "7. Treat transaction status values as: progress = pending/onchain confirmation in flight, success = final confirmed, error = final failed.",
    `8. If a transfer returns status=progress, poll GET ${baseUrl}/v1/card/transactions?limit=20 until the matching hash becomes success or error.`,
    "9. Ask for confirmation before high-risk or ambiguous payments, especially when the destination or amount is inferred rather than explicit.",
  ].join("\n")
}

function buildTransferPlaybook(baseUrl: string) {
  return [
    "Transfer playbook:",
    `- Step 1: GET ${baseUrl}/v1/card/me`,
    `- Step 2: GET ${baseUrl}/v1/card/limits`,
    `- Step 3: GET ${baseUrl}/v1/card/policies`,
    `- Step 4: POST ${baseUrl}/v1/card/transactions/quote with {"to":"0x...","value":"<wei>","description":"..."}`,
    `- Step 5: POST ${baseUrl}/v1/card/transactions with the same body and a unique idempotency-key header`,
    `- Step 6: If the returned transaction status is progress, poll GET ${baseUrl}/v1/card/transactions?limit=20 until the transaction hash reaches success or error`,
    `- Step 7: Report the final hash, recipient, amount, and final status`,
  ].join("\n")
}

function buildProductIntro(product: SkillProduct) {
  if (product === "openclaw") {
    return [
      "You are an OpenClaw integration package for a Sigloop card.",
      "Your job is to give the OpenClaw agent enough context to safely inspect the card, reason about constraints, and execute valid onchain operations through the Sigloop card-service API.",
      "Prefer explicit step-by-step tool usage and deterministic HTTP calls over vague natural-language instructions.",
    ].join("\n")
  }

  if (product === "claude") {
    return [
      "You are a Claude skill for operating a Sigloop card through card-service.",
      "Claude should use this package as the authoritative operational guide for reading card state, evaluating policy constraints, and executing transfers safely.",
      "Behavior should be conservative, explicit, and audit-friendly.",
    ].join("\n")
  }

  return [
    "You are a Codex skill for operating a Sigloop card through card-service.",
    "Use the provided API contract and wallet context as the source of truth for card operations.",
    "Act like an engineering-grade wallet operator: inspect constraints, quote before sending, and reconcile final status.",
  ].join("\n")
}

function buildSkillInstructions(product: SkillProduct, cardContext: CardContext, baseUrl: string) {
  const title =
    product === "openclaw"
      ? "# OpenClaw Sigloop Card Skill"
      : product === "claude"
        ? "# Claude Sigloop Card Skill"
        : "# Codex Sigloop Card Skill"

  return [
    title,
    "",
    "## Role",
    buildProductIntro(product),
    "",
    "## Wallet Snapshot",
    buildWalletSnapshot(cardContext),
    "",
    "## Policies",
    formatPolicies(cardContext.policies),
    "",
    "## API Contract",
    buildCardServiceReference(baseUrl),
    "",
    "## Operational Rules",
    buildOperationalRules(baseUrl),
    "",
    "## Execution Flow",
    buildTransferPlaybook(baseUrl),
    "",
    "## Response Style",
    "- When reading state, summarize the card state in plain language and include the raw numerical values when useful.",
    "- When executing a transaction, clearly state the destination, value in wei, why it is allowed, and the final hash/status.",
    "- If policy information is missing or stale, refresh it instead of assuming.",
  ].join("\n")
}

function buildSkillReadme(product: SkillProduct, baseUrl: string) {
  const platformName =
    product === "openclaw"
      ? "OpenClaw"
      : product === "claude"
        ? "Claude"
        : "Codex"

  return [
    `# Sigloop ${platformName} Card Skill`,
    "",
    "This bundle contains:",
    "- `prompt/SKILL.md`: product-specific agent instructions",
    "- `manifest.json`: machine-readable API and card metadata",
    "- `examples/http.md`: ready HTTP examples against the live card-service",
    "- `.env.example`: environment variables pointing at the live service",
    "",
    `Card-service base URL: ${baseUrl}`,
    "",
    "The generated instructions assume the agent can fully manage the assigned card by reading state, evaluating policies, quoting transfers, executing transfers, and reconciling final status.",
  ].join("\n")
}

function buildSkillExamples(cardSecret: string, baseUrl: string) {
  return [
    "# HTTP Examples",
    "",
    "All requests use the live Sigloop card-service URL and the card secret assigned to this integration.",
    "",
    "## Read balance",
    "```bash",
    `curl -s "${baseUrl}/v1/card/balance" \\`,
    `  -H "x-card-secret: ${cardSecret}"`,
    "```",
    "",
    "## Read policies",
    "```bash",
    `curl -s "${baseUrl}/v1/card/policies" \\`,
    `  -H "x-card-secret: ${cardSecret}"`,
    "```",
    "",
    "## Quote transfer",
    "```bash",
    `curl -s "${baseUrl}/v1/card/transactions/quote" \\`,
    `  -H "x-card-secret: ${cardSecret}" \\`,
    '  -H "content-type: application/json" \\',
    '  --data \'{"to":"0x000000000000000000000000000000000000dead","value":"1000000000000000","description":"Example transfer"}\'',
    "```",
    "",
    "## Execute transfer",
    "```bash",
    `curl -s "${baseUrl}/v1/card/transactions" \\`,
    `  -H "x-card-secret: ${cardSecret}" \\`,
    '  -H "content-type: application/json" \\',
    '  -H "idempotency-key: sigloop-example-001" \\',
    '  --data \'{"to":"0x000000000000000000000000000000000000dead","value":"1000000000000000","description":"Example transfer"}\'',
    "```",
    "",
    "## Inspect transaction history",
    "```bash",
    `curl -s "${baseUrl}/v1/card/transactions?limit=20" \\`,
    `  -H "x-card-secret: ${cardSecret}"`,
    "```",
  ].join("\n")
}

function buildBootstrapPrompt(params: {
  product: SkillProduct
  publicUrl: string
  cardContext: CardContext
  baseUrl: string
}) {
  const { product, publicUrl, cardContext, baseUrl } = params
  const productLabel = product === "openclaw" ? "OpenClaw" : product === "claude" ? "Claude" : "Codex"

  return [
    `Install and use the Sigloop ${productLabel} card skill from this public URL: ${publicUrl}`,
    "",
    "Instructions:",
    `1. Open the URL and read the published skill package for the assigned Sigloop card.`,
    "2. Treat the package as the source of truth for the wallet metadata, policies, API contract, and transaction rules.",
    "3. Use the documented card-service endpoints and never expose the card secret.",
    "4. Before sending funds, inspect limits and policies, then quote, then send with a unique idempotency key.",
    "5. If a transaction returns progress, keep checking transaction history until it becomes success or error.",
    "",
    "Assigned card context:",
    buildWalletSnapshot(cardContext),
    "",
    `Card-service base URL: ${baseUrl}`,
  ].join("\n")
}

function buildSkillManifest(params: {
  product: SkillProduct
  preset: IntegrationPreset
  cardContext: CardContext
  baseUrl: string
}) {
  const { product, preset, cardContext, baseUrl } = params

  return {
    kind: "sigloop-agent-skill",
    schemaVersion: preset.schemaVersion,
    generatedAt: new Date().toISOString(),
    product,
    wallet: {
      name: cardContext.name,
      status: cardContext.status,
      chain: cardContext.chain,
      accountAddress: cardContext.accountAddress,
      accountId: cardContext.accountId,
      limit: cardContext.limit,
      spent: cardContext.spent,
      policies: cardContext.policies ?? [],
      agentPurpose: cardContext.agentPurpose,
      taskScope: cardContext.taskScope,
      behavioralRules: cardContext.behavioralRules,
      escalationPolicy: cardContext.escalationPolicy,
    },
    api: {
      baseUrl,
      authHeader: "x-card-secret",
      writeHeaders: ["idempotency-key"],
      readEndpoints: [
        "GET /v1/card/me",
        "GET /v1/card/balance",
        "GET /v1/card/limits",
        "GET /v1/card/policies",
        "GET /v1/card/summary",
        "GET /v1/card/transactions",
      ],
      writeEndpoints: [
        "POST /v1/card/transactions/quote",
        "POST /v1/card/transactions",
        "POST /v1/card/pause",
        "POST /v1/card/resume",
      ],
      transactionStatuses: ["progress", "error", "success"],
    },
  }
}

function buildSkillFiles(params: {
  product: SkillProduct
  preset: IntegrationPreset
  cardSecret: string
  cardContext: CardContext
  baseUrl: string
}) {
  const { product, preset, cardSecret, cardContext, baseUrl } = params
  const manifest = buildSkillManifest({ product, preset, cardContext, baseUrl })

  return [
    {
      path: "README.md",
      content: buildSkillReadme(product, baseUrl),
    },
    {
      path: "prompt/SKILL.md",
      content: buildSkillInstructions(product, cardContext, baseUrl),
    },
    {
      path: "manifest.json",
      content: JSON.stringify(manifest, null, 2),
    },
    {
      path: "examples/http.md",
      content: buildSkillExamples(cardSecret, baseUrl),
    },
    {
      path: ".env.example",
      content: `SIGLOOP_CARD_SERVICE_URL=${baseUrl}\nSIGLOOP_CARD_SECRET=${cardSecret}\n`,
    },
  ] satisfies ArtifactFile[]
}

export function createSkillArtifactPayload(params: {
  skillProduct: SkillProduct
  preset: IntegrationPreset
  cardSecret: string
  cardContext: CardContext
  baseUrl: string
  publicUrl: string
}): SkillArtifactPayload {
  const files = buildSkillFiles({
    product: params.skillProduct,
    preset: params.preset,
    cardSecret: params.cardSecret,
    cardContext: params.cardContext,
    baseUrl: params.baseUrl,
  })

  const bootstrapPrompt = buildBootstrapPrompt({
    product: params.skillProduct,
    publicUrl: params.publicUrl,
    cardContext: params.cardContext,
    baseUrl: params.baseUrl,
  })

  return {
    version: 1,
    product: params.skillProduct,
    publicUrl: params.publicUrl,
    publishedAt: new Date().toISOString(),
    wallet: params.cardContext,
    apiBaseUrl: params.baseUrl,
    bootstrapPrompt,
    files,
  }
}

function buildLangChainSystemPrompt(baseUrl: string, cardContext: CardContext) {
  return [
    "You are an agent operating a Sigloop card through LangChain tools.",
    "Treat the exported tools as the only approved interface for wallet state and transfers.",
    "",
    "Wallet context:",
    buildWalletSnapshot(cardContext),
    "",
    "Policies:",
    formatPolicies(cardContext.policies),
    "",
    "Execution contract:",
    buildOperationalRules(baseUrl),
    "",
    "Before sending funds, use the tools that map to limits, policies, and quote.",
    "If a send operation returns progress, continue checking transaction history until the hash reaches success or error.",
  ].join("\n")
}

function buildLangChainJsModule(params: {
  cardSecret: string
  baseUrl: string
  cardContext: CardContext
}) {
  const { cardSecret, baseUrl, cardContext } = params
  const systemPrompt = JSON.stringify(buildLangChainSystemPrompt(baseUrl, cardContext))

  return `import { z } from "zod"
import { tool } from "@langchain/core/tools"

export const SIGLOOP_CARD_SYSTEM_PROMPT = ${systemPrompt}

async function parseJsonResponse(res) {
  const text = await res.text()
  if (!text) return {}
  return JSON.parse(text)
}

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
      if (!res.ok) {
        throw new Error(await res.text())
      }
      return parseJsonResponse(res)
    } finally {
      clearTimeout(timer)
    }
  }

  const cardMe = tool(async () => request("GET", "/v1/card/me"), {
    name: "card_me",
    description: "Return card metadata including status, chain, and account address.",
    schema: z.object({}),
  })

  const cardBalance = tool(async () => request("GET", "/v1/card/balance"), {
    name: "card_balance",
    description: "Return live card balance and spent amount.",
    schema: z.object({}),
  })

  const cardLimits = tool(async () => request("GET", "/v1/card/limits"), {
    name: "card_limits",
    description: "Return card limit, spent amount, remaining amount, and reset schedule.",
    schema: z.object({}),
  })

  const cardPolicies = tool(async () => request("GET", "/v1/card/policies"), {
    name: "card_policies",
    description: "Return all active card policy rules that constrain transfers.",
    schema: z.object({}),
  })

  const cardSummary = tool(async () => request("GET", "/v1/card/summary"), {
    name: "card_summary",
    description: "Return a high-level card snapshot including recent transactions.",
    schema: z.object({}),
  })

  const cardTransactions = tool(async ({ limit = 20 }) => request("GET", "/v1/card/transactions", {
    params: { limit: String(limit) },
  }), {
    name: "card_transactions",
    description: "Return transaction history. Use this to reconcile transactions that are still in progress.",
    schema: z.object({ limit: z.number().int().positive().max(200).default(20) }),
  })

  const cardQuoteTransaction = tool(async ({ to, valueWei, description }) => request("POST", "/v1/card/transactions/quote", {
    body: { to, value: valueWei, ...(description ? { description } : {}) },
  }), {
    name: "card_quote_transaction",
    description: "Quote a transfer and confirm limits, policies, and balance allow it before sending.",
    schema: z.object({
      to: z.string().describe("Destination EVM address"),
      valueWei: z.string().describe("Transfer amount in wei"),
      description: z.string().optional(),
    }),
  })

  const cardSendTransaction = tool(async ({ to, valueWei, description, idempotencyKey }) => request("POST", "/v1/card/transactions", {
    body: { to, value: valueWei, ...(description ? { description } : {}) },
    extraHeaders: { "idempotency-key": idempotencyKey || \`langchain-js-\${crypto.randomUUID()}\` },
  }), {
    name: "card_send_transaction",
    description: "Execute a transfer. If the result status is progress, keep checking card_transactions until it becomes success or error.",
    schema: z.object({
      to: z.string().describe("Destination EVM address"),
      valueWei: z.string().describe("Transfer amount in wei"),
      description: z.string().optional(),
      idempotencyKey: z.string().optional(),
    }),
  })

  const cardPause = tool(async () => request("POST", "/v1/card/pause"), {
    name: "card_pause",
    description: "Pause the card so spending operations stop.",
    schema: z.object({}),
  })

  const cardResume = tool(async () => request("POST", "/v1/card/resume"), {
    name: "card_resume",
    description: "Resume the card after a pause.",
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

function buildLangChainPyModule(params: {
  cardSecret: string
  baseUrl: string
  cardContext: CardContext
}) {
  const { cardSecret, baseUrl, cardContext } = params
  const systemPrompt = JSON.stringify(buildLangChainSystemPrompt(baseUrl, cardContext))

  return `from __future__ import annotations

import json
import uuid
from typing import Any

import requests
from langchain_core.tools import tool

SIGLOOP_CARD_SYSTEM_PROMPT = ${systemPrompt}

__all__ = ["SIGLOOP_CARD_SYSTEM_PROMPT", "create_sigloop_wallet_tools"]


def create_sigloop_wallet_tools(base_url: str = "${baseUrl}", card_secret: str = "${cardSecret}", timeout: float = 30.0):
    """Return LangChain tools for Sigloop card operations."""

    def _request(method: str, path: str, *, body: dict[str, Any] | None = None, params: dict[str, Any] | None = None, extra_headers: dict[str, str] | None = None) -> dict[str, Any]:
        headers = {
            "x-card-secret": card_secret,
            "content-type": "application/json",
        }
        if extra_headers:
            headers.update(extra_headers)
        response = requests.request(method, f"{base_url}{path}", headers=headers, json=body, params=params, timeout=timeout)
        response.raise_for_status()
        if not response.text:
            return {}
        return response.json()

    @tool
    def card_me() -> dict[str, Any]:
        """Return card metadata including status, chain, and account address."""
        return _request("GET", "/v1/card/me")

    @tool
    def card_balance() -> dict[str, Any]:
        """Return live card balance and spent amount."""
        return _request("GET", "/v1/card/balance")

    @tool
    def card_limits() -> dict[str, Any]:
        """Return card limit, spent amount, remaining amount, and reset schedule."""
        return _request("GET", "/v1/card/limits")

    @tool
    def card_policies() -> dict[str, Any]:
        """Return active card policy rules."""
        return _request("GET", "/v1/card/policies")

    @tool
    def card_summary() -> dict[str, Any]:
        """Return a card snapshot with recent activity."""
        return _request("GET", "/v1/card/summary")

    @tool
    def card_transactions(limit: int = 20) -> dict[str, Any]:
        """Return transaction history. Use this to reconcile progress transactions."""
        safe_limit = max(1, min(int(limit), 200))
        return _request("GET", "/v1/card/transactions", params={"limit": safe_limit})

    @tool
    def card_quote_transaction(to: str, value_wei: str, description: str = "") -> dict[str, Any]:
        """Quote a transfer before execution."""
        body = {"to": to, "value": value_wei}
        if description:
            body["description"] = description
        return _request("POST", "/v1/card/transactions/quote", body=body)

    @tool
    def card_send_transaction(to: str, value_wei: str, description: str = "", idempotency_key: str = "") -> dict[str, Any]:
        """Execute a transfer. If the result is progress, poll card_transactions until it becomes success or error."""
        body = {"to": to, "value": value_wei}
        if description:
            body["description"] = description
        idem = idempotency_key or f"langchain-py-{uuid.uuid4()}"
        return _request("POST", "/v1/card/transactions", body=body, extra_headers={"idempotency-key": idem})

    @tool
    def card_pause() -> dict[str, Any]:
        """Pause the card."""
        return _request("POST", "/v1/card/pause")

    @tool
    def card_resume() -> dict[str, Any]:
        """Resume the card."""
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

function buildLangChainReadme(language: LangChainLanguage, baseUrl: string) {
  const usage =
    language === "python"
      ? [
        "```python",
        "from langchain_openai import ChatOpenAI",
        "from sigloop_wallet_tools import create_sigloop_wallet_tools, SIGLOOP_CARD_SYSTEM_PROMPT",
        "",
        "tools = create_sigloop_wallet_tools()",
        'model = ChatOpenAI(model=\"gpt-4o-mini\")',
        "# Inject SIGLOOP_CARD_SYSTEM_PROMPT into your system message when creating the agent.",
        "```",
      ].join("\n")
      : [
        "```js",
        "import { ChatOpenAI } from \"@langchain/openai\"",
        "import { createSigloopWalletTools, SIGLOOP_CARD_SYSTEM_PROMPT } from \"./sigloop_wallet_tools.mjs\"",
        "",
        "const tools = createSigloopWalletTools()",
        "const model = new ChatOpenAI({ model: \"gpt-4o-mini\" })",
        "// Inject SIGLOOP_CARD_SYSTEM_PROMPT into your system message when creating the agent.",
        "```",
      ].join("\n")

  return [
    "# Sigloop LangChain Card Toolkit",
    "",
    `Card-service base URL: ${baseUrl}`,
    "",
    "This bundle gives your LangChain agent both:",
    "- a complete toolset for the Sigloop card-service",
    "- a system prompt that explains how to use the tools safely and completely",
    "",
    "The generated tools cover metadata, balance, limits, policies, summary, transaction history, quoting, sending, pause, and resume.",
    "",
    "## Usage",
    usage,
  ].join("\n")
}

function buildLangChainExample(language: LangChainLanguage) {
  if (language === "python") {
    return [
      "from sigloop_wallet_tools import create_sigloop_wallet_tools, SIGLOOP_CARD_SYSTEM_PROMPT",
      "",
      "tools = create_sigloop_wallet_tools()",
      "print(SIGLOOP_CARD_SYSTEM_PROMPT)",
      "print([tool.name for tool in tools])",
    ].join("\n")
  }

  return [
    "import { createSigloopWalletTools, SIGLOOP_CARD_SYSTEM_PROMPT } from \"./sigloop_wallet_tools.mjs\"",
    "",
    "const tools = createSigloopWalletTools()",
    "console.log(SIGLOOP_CARD_SYSTEM_PROMPT)",
    "console.log(tools.map((tool) => tool.name))",
  ].join("\n")
}

function buildLangChainFiles(params: {
  language: LangChainLanguage
  cardSecret: string
  baseUrl: string
  cardContext: CardContext
}) {
  const { language, cardSecret, baseUrl, cardContext } = params
  const modulePath = language === "python" ? "sigloop_wallet_tools.py" : "sigloop_wallet_tools.mjs"
  const moduleContent =
    language === "python"
      ? buildLangChainPyModule({ cardSecret, baseUrl, cardContext })
      : buildLangChainJsModule({ cardSecret, baseUrl, cardContext })

  return [
    {
      path: "README.md",
      content: buildLangChainReadme(language, baseUrl),
    },
    {
      path: modulePath,
      content: moduleContent,
    },
    {
      path: "examples/usage.txt",
      content: buildLangChainExample(language),
    },
    {
      path: ".env.example",
      content: `SIGLOOP_CARD_SERVICE_URL=${baseUrl}\nSIGLOOP_CARD_SECRET=${cardSecret}\n`,
    },
  ] satisfies ArtifactFile[]
}

export async function downloadSkillBundle(params: {
  skillProduct: SkillProduct
  preset: IntegrationPreset
  cardSecret: string
  cardContext: CardContext
  baseUrl: string
}) {
  const payload = createSkillArtifactPayload({
    skillProduct: params.skillProduct,
    preset: params.preset,
    cardSecret: params.cardSecret,
    cardContext: params.cardContext,
    baseUrl: params.baseUrl,
    publicUrl: params.baseUrl,
  })
  await downloadZip(`${params.skillProduct}-sigloop-skill.zip`, payload.files)
}

export async function downloadLangChainBundle(params: {
  language: LangChainLanguage
  cardSecret: string
  baseUrl: string
  cardContext: CardContext
}) {
  const files = buildLangChainFiles(params)
  await downloadZip(`sigloop-langchain-${params.language}.zip`, files)
}
