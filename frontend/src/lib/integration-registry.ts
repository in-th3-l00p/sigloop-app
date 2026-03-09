export type IntegrationType = "skill" | "library" | "api"
export type SkillProduct = "codex" | "claude" | "openclaw"
export type LangChainLanguage = "javascript" | "python"

export type IntegrationPreset = {
  id: string
  type: IntegrationType
  platform: string
  name: string
  description: string
  schemaVersion: number
  docsUrl: string
  docsLabel?: string
  platformActions: string[]
  curatedEndpoints?: Array<{ method: string; path: string; description: string }>
}

export const CARD_SERVICE_BASE_URL =
  import.meta.env.VITE_CARD_SERVICE_URL || "/api/card-service"

export const CARD_SDK_DOCS_URL = "/docs?section=card-sdk"

export const INTEGRATION_PRESETS: IntegrationPreset[] = [
  {
    id: "skill",
    type: "skill",
    platform: "skill",
    name: "Skill",
    description: "Generate a skill package for a selected agent product.",
    schemaVersion: 2,
    docsUrl: "https://developers.openai.com",
    docsLabel: "Skill Docs",
    platformActions: [
      "Generates a product-specific skill bundle (Codex, Claude, or OpenClaw).",
      "Injects wallet metadata so the agent knows what wallet it controls.",
      "Explains how to read balance and perform operations through card-service.",
      "Produces a downloadable ZIP package.",
    ],
  },
  {
    id: "langchain",
    type: "library",
    platform: "langchain",
    name: "Langchain",
    description: "Generate a LangChain wallet-tools file (JavaScript or Python).",
    schemaVersion: 2,
    docsUrl: "https://python.langchain.com",
    docsLabel: "LangChain Docs",
    platformActions: [
      "Generates a downloadable wallet-tools file in the selected language.",
      "Exports a tools factory for wallet metadata, balance checks, and operations.",
      "Provides the full card-service tool set with auth and transaction helpers.",
      "Works the same in Python and JavaScript.",
    ],
  },
  {
    id: "direct-api",
    type: "api",
    platform: "api",
    name: "Direct api",
    description: "Use card-service endpoints directly with env variables and examples.",
    schemaVersion: 2,
    docsUrl: `${CARD_SERVICE_BASE_URL}/openapi.json`,
    docsLabel: "OpenAPI",
    platformActions: [
      "Provides direct HTTP integration with card-service.",
      "Shows required env vars and endpoint examples.",
      "Includes how to read wallet balance and execute operations.",
      "Links to Card SDK docs if you want a typed client.",
    ],
    curatedEndpoints: [
      { method: "GET", path: "/v1/card/me", description: "Wallet metadata" },
      { method: "GET", path: "/v1/card/balance", description: "Wallet balance" },
      { method: "GET", path: "/v1/card/summary", description: "Wallet + activity snapshot" },
      { method: "POST", path: "/v1/card/transactions/quote", description: "Quote operation" },
      { method: "POST", path: "/v1/card/transactions", description: "Execute operation" },
    ],
  },
]

export function getPresetById(id: string): IntegrationPreset | undefined {
  return INTEGRATION_PRESETS.find((preset) => preset.id === id)
}

export function getSkillProductOptions(): Array<{ value: SkillProduct; label: string }> {
  return [
    { value: "codex", label: "Codex" },
    { value: "claude", label: "Claude" },
    { value: "openclaw", label: "OpenClaw" },
  ]
}

export function getSkillDocsByProduct(product: SkillProduct): { label: string; url: string } {
  if (product === "claude") {
    return { label: "Claude Docs", url: "https://docs.anthropic.com" }
  }
  if (product === "openclaw") {
    return { label: "OpenClaw Docs", url: "https://github.com/openclaw" }
  }
  return { label: "Codex Docs", url: "https://developers.openai.com" }
}

export function getLangChainInstallCommand(language: LangChainLanguage, packageManager: string) {
  if (language === "python") {
    return "pip install langchain langchain-openai requests python-dotenv"
  }

  if (packageManager === "pnpm") return "pnpm add @langchain/openai @langchain/core dotenv zod"
  if (packageManager === "yarn") return "yarn add @langchain/openai @langchain/core dotenv zod"
  return "npm i @langchain/openai @langchain/core dotenv zod"
}

export function getLangChainEnvTemplate(baseUrl = CARD_SERVICE_BASE_URL) {
  return `SIGLOOP_CARD_SECRET=sgl_...\nSIGLOOP_CARD_SERVICE_URL=${baseUrl}\nOPENAI_API_KEY=sk-...\nOPENAI_MODEL=gpt-4o-mini`
}

export function getDirectApiEnvTemplate(baseUrl = CARD_SERVICE_BASE_URL) {
  return `SIGLOOP_CARD_SECRET=sgl_...\nSIGLOOP_CARD_SERVICE_URL=${baseUrl}`
}

export function getDirectApiSnippet() {
  return `curl -s "$SIGLOOP_CARD_SERVICE_URL/v1/card/balance" \\\n  -H "x-card-secret: $SIGLOOP_CARD_SECRET"`
}
