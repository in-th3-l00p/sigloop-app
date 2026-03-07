import dotenv from "dotenv"
import { HumanMessage, ToolMessage } from "@langchain/core/messages"
import { ChatOpenAI } from "@langchain/openai"
import { createSigloopWalletTools } from "./sigloop_wallet_tools.mjs"

dotenv.config({ path: new URL(".env.local", import.meta.url).pathname, quiet: true })
dotenv.config({ quiet: true })

const tools = createSigloopWalletTools({
  baseUrl: process.env.SIGLOOP_CARD_SERVICE_URL,
  cardSecret: process.env.SIGLOOP_CARD_SECRET,
})

const toolMap = new Map(tools.map((t) => [t.name, t]))
const llm = new ChatOpenAI({ apiKey: process.env.OPENAI_API_KEY, model: process.env.OPENAI_MODEL ?? "gpt-4o-mini", temperature: 0 })
const llmWithTools = llm.bindTools(tools)
const messages = [new HumanMessage("Call card_summary and explain in 3 bullets.")]

for (let i = 0; i < 6; i += 1) {
  const ai = await llmWithTools.invoke(messages)
  messages.push(ai)
  const calls = ai.tool_calls ?? []
  if (calls.length === 0) {
    console.log(ai.content)
    process.exit(0)
  }

  for (const call of calls) {
    const selected = toolMap.get(call.name)
    const result = selected ? await selected.invoke(call.args ?? {}) : `Unknown tool: ${call.name}`
    messages.push(new ToolMessage({ tool_call_id: call.id, name: call.name, content: String(result) }))
  }
}

throw new Error("Agent exceeded iteration limit")
