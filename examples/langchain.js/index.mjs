import { runAgent } from "./agent.mjs"

async function main() {
  const userPrompt = process.argv.slice(2).join(" ") || "Give me a concise operational snapshot of card and API state."
  const result = await runAgent(userPrompt)
  console.log(result.text)
}

main().catch((error) => {
  console.error("langchain example failed:", error)
  process.exitCode = 1
})
