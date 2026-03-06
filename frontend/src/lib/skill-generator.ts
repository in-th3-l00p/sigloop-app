import type { IntegrationPreset } from "@/lib/integration-registry"

type IntegrationItem = {
  name: string
  description: string
  platform: string
  type: string
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
  agentPurpose?: string
  taskScope?: string
  behavioralRules?: string
  escalationPolicy?: string
}

export function generateSkillArtifact(params: {
  preset: IntegrationPreset
  integration: IntegrationItem
  cardSecret: string
  cardContext: CardContext
  baseUrl: string
}): { filename: string; content: string; mimeType: string } {
  const { preset, integration, cardSecret, cardContext, baseUrl } = params

  const instructions = [
    "You are an agent with controlled wallet access through a Sigloop card.",
    "Always read constraints first before sending transactions.",
    "Use GET /v1/card/limits and GET /v1/card/policies before spend decisions.",
    "For payments, call POST /v1/card/transactions/quote, then POST /v1/card/transactions.",
    "Attach x-card-secret for every call.",
    "For POST /v1/card/transactions, include idempotency-key header with a unique value per intent.",
    "After sending, inspect status in GET /v1/card/transactions or GET /v1/card/summary.",
    "Never expose the card secret in logs or public responses.",
  ]

  const providedAgentInfo = [
    `Card name: ${cardContext.name ?? "Unknown"}`,
    `Card status: ${cardContext.status ?? "Unknown"}`,
    `Chain: ${cardContext.chain ?? "Unknown"}`,
    `Wallet address: ${cardContext.accountAddress ?? "Unknown"}`,
    `Spending limit (wei): ${cardContext.limit ?? "unlimited"}`,
    `Spent (wei): ${cardContext.spent ?? "0"}`,
    `Policies: ${(cardContext.policies ?? []).map((p) => `${p.type}=${p.value}`).join(", ") || "none"}`,
    `Agent purpose: ${cardContext.agentPurpose || "Not set"}`,
    `Task scope: ${cardContext.taskScope || "Not set"}`,
    `Behavior rules: ${cardContext.behavioralRules || "Not set"}`,
    `Escalation policy: ${cardContext.escalationPolicy || "Not set"}`,
  ]

  const toolReference = {
    auth: {
      header: "x-card-secret",
      value: cardSecret,
    },
    baseUrl,
    endpoints: [
      { method: "GET", path: "/v1/card/me", purpose: "Profile" },
      { method: "GET", path: "/v1/card/balance", purpose: "Live balance" },
      { method: "GET", path: "/v1/card/limits", purpose: "Limit and remaining" },
      { method: "GET", path: "/v1/card/policies", purpose: "Policy rules" },
      { method: "GET", path: "/v1/card/summary", purpose: "Snapshot state" },
      { method: "GET", path: "/v1/card/transactions", purpose: "History" },
      { method: "POST", path: "/v1/card/transactions/quote", purpose: "Preflight" },
      { method: "POST", path: "/v1/card/transactions", purpose: "Execute transfer" },
    ],
  }

  const payload = {
    kind: "sigloop-agent-skill",
    schemaVersion: 1,
    generatedAt: new Date().toISOString(),
    platform: preset.platform,
    integration: {
      name: integration.name,
      description: integration.description,
      type: integration.type,
    },
    cardContext: {
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
    providedAgentInfo,
    instructions,
    api: toolReference,
  }

  return {
    filename: `${preset.platform}-sigloop-skill.json`,
    content: JSON.stringify(payload, null, 2),
    mimeType: "application/json",
  }
}

export function downloadSkillArtifact(artifact: { filename: string; content: string; mimeType: string }) {
  const blob = new Blob([artifact.content], { type: artifact.mimeType })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement("a")
  anchor.href = url
  anchor.download = artifact.filename
  document.body.appendChild(anchor)
  anchor.click()
  anchor.remove()
  URL.revokeObjectURL(url)
}
