export type IntegrationType = "skill" | "library" | "api"

export type IntegrationPreset = {
  id: string
  type: IntegrationType
  platform: string
  name: string
  description: string
  schemaVersion: number
  docsUrl: string
  skillDownloadUrl?: string
  installCommand?: string
  envTemplate?: string
  snippet?: string
  curatedEndpoints?: Array<{ method: string; path: string; description: string }>
}

export const CARD_SERVICE_BASE_URL =
  import.meta.env.VITE_CARD_SERVICE_URL || "http://localhost:8787"

export const INTEGRATION_PRESETS: IntegrationPreset[] = [
  {
    id: "codex-skill",
    type: "skill",
    platform: "codex",
    name: "Codex Skill",
    description: "Download and install a Codex skill package that wraps Sigloop card actions.",
    schemaVersion: 1,
    docsUrl: "https://developers.openai.com",
    skillDownloadUrl: `${CARD_SERVICE_BASE_URL}/downloads/skills/codex-sigloop-skill.zip`,
    envTemplate: `SIGLOOP_CARD_SECRET=sgl_...\nSIGLOOP_CARD_SERVICE_URL=${CARD_SERVICE_BASE_URL}`,
  },
  {
    id: "openclaw-skill",
    type: "skill",
    platform: "openclaw",
    name: "OpenClaw Skill",
    description: "Install the Sigloop skill bundle for OpenClaw agents.",
    schemaVersion: 1,
    docsUrl: "https://github.com/openclaw",
    skillDownloadUrl: `${CARD_SERVICE_BASE_URL}/downloads/skills/openclaw-sigloop-skill.zip`,
    envTemplate: `SIGLOOP_CARD_SECRET=sgl_...\nSIGLOOP_CARD_SERVICE_URL=${CARD_SERVICE_BASE_URL}`,
  },
  {
    id: "langchain-library-js",
    type: "library",
    platform: "langchain",
    name: "LangChain JS Library",
    description: "Use a JavaScript helper library for Sigloop card actions in LangChain agents.",
    schemaVersion: 1,
    docsUrl: "https://js.langchain.com",
    installCommand: "npm i @sigloop/langchain-card",
    envTemplate: `SIGLOOP_CARD_SECRET=sgl_...\nSIGLOOP_CARD_SERVICE_URL=${CARD_SERVICE_BASE_URL}`,
    snippet: `import { createSigloopCardToolset } from "@sigloop/langchain-card"\n\nconst tools = createSigloopCardToolset({\n  cardSecret: process.env.SIGLOOP_CARD_SECRET,\n  baseUrl: process.env.SIGLOOP_CARD_SERVICE_URL,\n})`,
  },
  {
    id: "langchain-library-py",
    type: "library",
    platform: "langchain",
    name: "LangChain Python Library",
    description: "Use a Python helper library for Sigloop card actions in LangChain agents.",
    schemaVersion: 1,
    docsUrl: "https://python.langchain.com",
    installCommand: "pip install sigloop-langchain-card",
    envTemplate: `SIGLOOP_CARD_SECRET=sgl_...\nSIGLOOP_CARD_SERVICE_URL=${CARD_SERVICE_BASE_URL}`,
    snippet: `from sigloop_langchain import create_sigloop_card_tools\n\ntools = create_sigloop_card_tools(\n    card_secret=os.environ[\"SIGLOOP_CARD_SECRET\"],\n    base_url=os.environ[\"SIGLOOP_CARD_SERVICE_URL\"],\n)`,
  },
  {
    id: "elizaos-library",
    type: "library",
    platform: "elizaos",
    name: "ElizaOS Plugin Library",
    description: "Integrate Sigloop card actions via ElizaOS plugin hooks.",
    schemaVersion: 1,
    docsUrl: "https://elizaos.github.io",
    installCommand: "npm i @sigloop/eliza-card-plugin",
    envTemplate: `SIGLOOP_CARD_SECRET=sgl_...\nSIGLOOP_CARD_SERVICE_URL=${CARD_SERVICE_BASE_URL}`,
    snippet: `import { sigloopCardPlugin } from "@sigloop/eliza-card-plugin"\n\nagent.use(sigloopCardPlugin({\n  cardSecret: process.env.SIGLOOP_CARD_SECRET,\n  baseUrl: process.env.SIGLOOP_CARD_SERVICE_URL,\n}))`,
  },
  {
    id: "direct-api",
    type: "api",
    platform: "api",
    name: "Direct Card API",
    description: "Integrate directly with card-service endpoints using card secret auth.",
    schemaVersion: 1,
    docsUrl: `${CARD_SERVICE_BASE_URL}/docs`,
    envTemplate: `SIGLOOP_CARD_SECRET=sgl_...\nSIGLOOP_CARD_SERVICE_URL=${CARD_SERVICE_BASE_URL}`,
    curatedEndpoints: [
      { method: "GET", path: "/v1/card/me", description: "Card profile" },
      { method: "GET", path: "/v1/card/balance", description: "Live onchain balance" },
      { method: "GET", path: "/v1/card/limits", description: "Spend and limit window" },
      { method: "GET", path: "/v1/card/policies", description: "Policy rules" },
      { method: "GET", path: "/v1/card/transactions", description: "Transaction history" },
      { method: "POST", path: "/v1/card/transactions", description: "Execute transaction" },
    ],
    snippet: `curl -s $SIGLOOP_CARD_SERVICE_URL/v1/card/summary \\\n  -H \"x-card-secret: $SIGLOOP_CARD_SECRET\"`,
  },
]

export function getPresetById(id: string): IntegrationPreset | undefined {
  return INTEGRATION_PRESETS.find((preset) => preset.id === id)
}
