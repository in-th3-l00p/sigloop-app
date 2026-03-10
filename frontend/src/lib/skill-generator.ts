import type { IntegrationPreset } from "@/lib/integration-registry"

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
  cardSecret: string
  cardContext: CardContext
  baseUrl: string
}): { filename: string; content: string; mimeType: string } {
  const { preset, cardSecret, cardContext, baseUrl } = params

  const instructions = [
    "You are an agent with controlled wallet access through a Sigloop card.",
    `The live card-service base URL is ${baseUrl}.`,
    "Always inspect limits and policies before proposing or sending transactions.",
    `Use GET ${baseUrl}/v1/card/limits and GET ${baseUrl}/v1/card/policies before spend decisions.`,
    `For payments, call POST ${baseUrl}/v1/card/transactions/quote first, then POST ${baseUrl}/v1/card/transactions.`,
    "Attach x-card-secret for every call.",
    "For POST /v1/card/transactions, include idempotency-key with a unique value per transfer intent.",
    "Treat transaction statuses as progress, success, or error.",
    `If a transaction is returned with status=progress, poll GET ${baseUrl}/v1/card/transactions until that hash reaches success or error.`,
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
      { method: "POST", path: "/v1/card/pause", purpose: "Pause card spending" },
      { method: "POST", path: "/v1/card/resume", purpose: "Resume card spending" },
    ],
  }

  const payload = {
    kind: "sigloop-agent-skill",
    schemaVersion: 1,
    generatedAt: new Date().toISOString(),
    platform: preset.platform,
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
