import dotenv from "dotenv"
import { z } from "zod"
import { ChatOpenAI } from "@langchain/openai"
import { tool } from "@langchain/core/tools"
import { HumanMessage, ToolMessage } from "@langchain/core/messages"
import { createCardClient } from "@sigloop/card"
import { createApiClient } from "@sigloop/api"

dotenv.config({ path: new URL(".env.local", import.meta.url).pathname, quiet: true })
dotenv.config({ quiet: true })

const modelName = process.env.OPENAI_MODEL ?? "gpt-4o-mini"
const openAiApiKey = process.env.OPENAI_API_KEY

if (!openAiApiKey) {
  throw new Error("Missing OPENAI_API_KEY")
}

const card = createCardClient({
  baseUrl: process.env.CARD_BASE_URL ?? "http://localhost:8787",
  cardSecret: process.env.CARD_SECRET,
})

const api = createApiClient({
  baseUrl: process.env.API_BASE_URL ?? "http://localhost:8788",
  apiKey: process.env.API_KEY,
})

const cardProfileTool = tool(
  async () => {
    const me = await card.me()
    return JSON.stringify(me, null, 2)
  },
  {
    name: "card_profile",
    description: "Get card profile with account address and status.",
    schema: z.object({}),
  },
)

const cardSummaryTool = tool(
  async () => {
    const summary = await card.summary()
    return JSON.stringify(summary, null, 2)
  },
  {
    name: "card_summary",
    description: "Get card summary including balance, limits, spent and recent transactions.",
    schema: z.object({}),
  },
)

const cardLimitsTool = tool(
  async () => {
    const limits = await card.limits()
    const policies = await card.policies()
    return JSON.stringify({ limits, policies: policies.policies }, null, 2)
  },
  {
    name: "card_limits_and_policies",
    description: "Get card limits and policy rules.",
    schema: z.object({}),
  },
)

const cardListTransactionsTool = tool(
  async ({ limit }) => {
    const txs = await card.transactions({ limit })
    return JSON.stringify(txs, null, 2)
  },
  {
    name: "card_list_transactions",
    description: "List card transactions.",
    schema: z.object({
      limit: z.number().int().positive().max(50).default(10),
    }),
  },
)

const cardQuoteTool = tool(
  async ({ to, valueWei, description }) => {
    const quote = await card.quoteTransaction({ to, value: valueWei, description })
    return JSON.stringify(quote, null, 2)
  },
  {
    name: "card_quote_transaction",
    description: "Quote a card transaction before execution.",
    schema: z.object({
      to: z.string().regex(/^0x[a-fA-F0-9]{40}$/),
      valueWei: z.string().regex(/^\d+$/),
      description: z.string().optional(),
    }),
  },
)

const cardSendTool = tool(
  async ({ to, valueWei, description }) => {
    const sent = await card.createTransaction({ to, value: valueWei, description })
    return JSON.stringify(sent, null, 2)
  },
  {
    name: "card_send_transaction",
    description: "Execute a live card transaction onchain.",
    schema: z.object({
      to: z.string().regex(/^0x[a-fA-F0-9]{40}$/),
      valueWei: z.string().regex(/^\d+$/),
      description: z.string().optional(),
    }),
  },
)

const cardPauseTool = tool(
  async () => {
    const res = await card.pause()
    return JSON.stringify(res, null, 2)
  },
  {
    name: "card_pause",
    description: "Pause the card.",
    schema: z.object({}),
  },
)

const cardResumeTool = tool(
  async () => {
    const res = await card.resume()
    return JSON.stringify(res, null, 2)
  },
  {
    name: "card_resume",
    description: "Resume the card.",
    schema: z.object({}),
  },
)

const apiOverviewTool = tool(
  async () => {
    const [me, accounts, contacts] = await Promise.all([api.me(), api.listAccounts(), api.listContacts()])
    return JSON.stringify({ me, accountCount: accounts.accounts.length, contactCount: contacts.contacts.length }, null, 2)
  },
  {
    name: "api_overview",
    description: "Get API key context and account/contact counts.",
    schema: z.object({}),
  },
)

const apiAccountsTool = tool(
  async () => {
    const result = await api.listAccounts()
    return JSON.stringify(result.accounts, null, 2)
  },
  {
    name: "api_accounts",
    description: "List smart accounts.",
    schema: z.object({}),
  },
)

const apiContactsTool = tool(
  async () => {
    const result = await api.listContacts()
    return JSON.stringify(result.contacts, null, 2)
  },
  {
    name: "api_contacts",
    description: "List contacts.",
    schema: z.object({}),
  },
)

const apiCreateContactTool = tool(
  async ({ name, address }) => {
    const result = await api.createContact({ name, address })
    return JSON.stringify(result, null, 2)
  },
  {
    name: "api_create_contact",
    description: "Create an API contact.",
    schema: z.object({
      name: z.string().min(1),
      address: z.string().regex(/^0x[a-fA-F0-9]{40}$/),
    }),
  },
)

const apiDeleteContactTool = tool(
  async ({ contactId }) => {
    const result = await api.removeContact(contactId)
    return JSON.stringify(result, null, 2)
  },
  {
    name: "api_delete_contact",
    description: "Delete an API contact by id.",
    schema: z.object({
      contactId: z.string().min(1),
    }),
  },
)

export const tools = [
  cardProfileTool,
  cardSummaryTool,
  cardLimitsTool,
  cardListTransactionsTool,
  cardQuoteTool,
  cardSendTool,
  cardPauseTool,
  cardResumeTool,
  apiOverviewTool,
  apiAccountsTool,
  apiContactsTool,
  apiCreateContactTool,
  apiDeleteContactTool,
]

const toolMap = new Map(tools.map((t) => [t.name, t]))

function contentToString(content) {
  if (typeof content === "string") return content
  if (Array.isArray(content)) {
    return content.map((part) => (typeof part === "string" ? part : JSON.stringify(part))).join("\n")
  }
  return JSON.stringify(content)
}

export async function runAgent(userPrompt, options = {}) {
  const llm = new ChatOpenAI({
    apiKey: openAiApiKey,
    model: modelName,
    temperature: 0,
  })

  const llmWithTools = llm.bindTools(tools)
  const messages = [new HumanMessage(userPrompt)]
  const trace = []

  for (let i = 0; i < (options.maxIterations ?? 8); i += 1) {
    const aiMessage = await llmWithTools.invoke(messages)
    messages.push(aiMessage)

    const calls = aiMessage.tool_calls ?? []
    if (calls.length === 0) {
      return {
        text: contentToString(aiMessage.content),
        trace,
      }
    }

    for (const call of calls) {
      const selectedTool = toolMap.get(call.name)
      if (!selectedTool) {
        const content = `Unknown tool: ${call.name}`
        trace.push({ name: call.name, args: call.args ?? {}, ok: false, content })
        messages.push(new ToolMessage({ tool_call_id: call.id, name: call.name, content }))
        continue
      }

      try {
        const result = await selectedTool.invoke(call.args ?? {})
        const content = typeof result === "string" ? result : JSON.stringify(result)
        trace.push({ name: call.name, args: call.args ?? {}, ok: true, content })
        messages.push(new ToolMessage({ tool_call_id: call.id, name: call.name, content }))
      } catch (error) {
        const content = `Tool ${call.name} failed: ${error instanceof Error ? error.message : String(error)}`
        trace.push({ name: call.name, args: call.args ?? {}, ok: false, content })
        messages.push(new ToolMessage({ tool_call_id: call.id, name: call.name, content }))
      }
    }
  }

  throw new Error("Agent exceeded tool-calling iteration limit")
}
