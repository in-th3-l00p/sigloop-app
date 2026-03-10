import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { CARD_SERVICE_BASE_URL } from "@/lib/integration-registry"
import { CodeBlock, DocSection, DocSubSection } from "./code-block"

export function AgentLangchainDocs() {
  return (
    <div className="space-y-8">
      <div>
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-bold tracking-tight">LangChain Integration</h1>
          <Badge variant="outline">JS & Python</Badge>
        </div>
        <p className="text-muted-foreground mt-2">
          Helper libraries that wrap the Card Service API into native LangChain tool sets.
          Available for both JavaScript and Python agents.
        </p>
      </div>

      <Separator />

      <DocSection title="LangChain JS">
        <div className="flex items-center gap-2 mb-3">
          <Badge variant="secondary" className="text-xs">@sigloop/langchain-card</Badge>
        </div>

        <DocSubSection title="Installation">
          <CodeBlock title="npm">{`npm i @sigloop/langchain-card`}</CodeBlock>
        </DocSubSection>

        <DocSubSection title="Environment Variables">
          <CodeBlock title=".env">{`SIGLOOP_CARD_SECRET=sgl_your_card_secret
SIGLOOP_CARD_SERVICE_URL=${CARD_SERVICE_BASE_URL}`}</CodeBlock>
        </DocSubSection>

        <DocSubSection title="Usage">
          <CodeBlock title="JavaScript">{`import { createSigloopCardToolset } from "@sigloop/langchain-card"

const tools = createSigloopCardToolset({
  cardSecret: process.env.SIGLOOP_CARD_SECRET,
  baseUrl: process.env.SIGLOOP_CARD_SERVICE_URL,
})

// Pass tools to your LangChain agent
const agent = createReactAgent({ llm, tools })`}</CodeBlock>
        </DocSubSection>

        <DocSubSection title="Full Example">
          <CodeBlock title="LangChain JS agent with Sigloop">{`import { ChatOpenAI } from "@langchain/openai"
import { createReactAgent } from "langchain/agents"
import { createSigloopCardToolset } from "@sigloop/langchain-card"

const llm = new ChatOpenAI({ model: "gpt-4o" })

const sigloopTools = createSigloopCardToolset({
  cardSecret: process.env.SIGLOOP_CARD_SECRET,
  baseUrl: process.env.SIGLOOP_CARD_SERVICE_URL,
})

const agent = createReactAgent({
  llm,
  tools: [...sigloopTools, ...otherTools],
  prompt: "You are a payment agent. Use Sigloop tools to check balances and make payments.",
})

const result = await agent.invoke({
  input: "Check my balance and send 0.01 ETH to 0x5678...abcd",
})`}</CodeBlock>
        </DocSubSection>

        <DocSubSection title="Available Tools">
          <p className="text-sm text-muted-foreground mb-2">
            The toolset exposes these LangChain tools to your agent:
          </p>
          <div className="rounded-lg border border-border overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="px-3 py-2 text-left font-medium">Tool</th>
                  <th className="px-3 py-2 text-left font-medium">Description</th>
                </tr>
              </thead>
              <tbody className="text-muted-foreground">
                <tr className="border-b border-border">
                  <td className="px-3 py-2 font-mono text-xs">sigloop_card_info</td>
                  <td className="px-3 py-2 text-xs">Get card profile, balance, and limits</td>
                </tr>
                <tr className="border-b border-border">
                  <td className="px-3 py-2 font-mono text-xs">sigloop_card_policies</td>
                  <td className="px-3 py-2 text-xs">Read active spending policies</td>
                </tr>
                <tr className="border-b border-border">
                  <td className="px-3 py-2 font-mono text-xs">sigloop_quote_tx</td>
                  <td className="px-3 py-2 text-xs">Preflight check a transaction</td>
                </tr>
                <tr className="border-b border-border">
                  <td className="px-3 py-2 font-mono text-xs">sigloop_send_tx</td>
                  <td className="px-3 py-2 text-xs">Execute a transaction</td>
                </tr>
                <tr>
                  <td className="px-3 py-2 font-mono text-xs">sigloop_tx_history</td>
                  <td className="px-3 py-2 text-xs">List recent transactions</td>
                </tr>
              </tbody>
            </table>
          </div>
        </DocSubSection>
      </DocSection>

      <Separator />

      <DocSection title="LangChain Python">
        <div className="flex items-center gap-2 mb-3">
          <Badge variant="secondary" className="text-xs">sigloop-langchain-card</Badge>
        </div>

        <DocSubSection title="Installation">
          <CodeBlock title="pip">{`pip install sigloop-langchain-card`}</CodeBlock>
        </DocSubSection>

        <DocSubSection title="Environment Variables">
          <CodeBlock title=".env">{`SIGLOOP_CARD_SECRET=sgl_your_card_secret
SIGLOOP_CARD_SERVICE_URL=${CARD_SERVICE_BASE_URL}`}</CodeBlock>
        </DocSubSection>

        <DocSubSection title="Usage">
          <CodeBlock title="Python">{`from sigloop_langchain import create_sigloop_card_tools
import os

tools = create_sigloop_card_tools(
    card_secret=os.environ["SIGLOOP_CARD_SECRET"],
    base_url=os.environ["SIGLOOP_CARD_SERVICE_URL"],
)

# Pass tools to your LangChain agent
agent = create_react_agent(llm=llm, tools=tools)`}</CodeBlock>
        </DocSubSection>

        <DocSubSection title="Full Example">
          <CodeBlock title="LangChain Python agent with Sigloop">{`from langchain_openai import ChatOpenAI
from langchain.agents import create_react_agent
from sigloop_langchain import create_sigloop_card_tools
import os

llm = ChatOpenAI(model="gpt-4o")

sigloop_tools = create_sigloop_card_tools(
    card_secret=os.environ["SIGLOOP_CARD_SECRET"],
    base_url=os.environ["SIGLOOP_CARD_SERVICE_URL"],
)

agent = create_react_agent(
    llm=llm,
    tools=[*sigloop_tools, *other_tools],
)

result = agent.invoke({
    "input": "Check my balance and send 0.01 ETH to 0x5678...abcd"
})`}</CodeBlock>
        </DocSubSection>
      </DocSection>

      <DocSection title="Dashboard Setup">
        <p className="text-sm text-muted-foreground">
          To register a LangChain integration from the dashboard:
        </p>
        <div className="space-y-2 mt-3">
          {[
            "Navigate to your card's Integrations section",
            "Add a new integration and select LangChain JS or LangChain Python",
            "Configure the agent purpose, task scope, and behavioral rules",
            "Copy the environment variables and install command",
          ].map((text, i) => (
            <div key={i} className="flex items-start gap-2 rounded-md bg-muted/30 px-3 py-2">
              <span className="text-xs font-medium text-primary mt-0.5">{i + 1}.</span>
              <p className="text-sm text-muted-foreground">{text}</p>
            </div>
          ))}
        </div>
      </DocSection>
    </div>
  )
}
