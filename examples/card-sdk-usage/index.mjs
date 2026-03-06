import "dotenv/config"
import { createCardClient } from "@sigloop/card"

const card = createCardClient({
  baseUrl: process.env.CARD_BASE_URL ?? "http://localhost:8787",
  cardSecret: process.env.CARD_SECRET ?? "sgl_81edeecc-4f5d-44a5-881a-3d44ee01440a",
})

async function main() {
  const [health, me, limits, policies, summary] = await Promise.all([
    card.health(),
    card.me(),
    card.limits(),
    card.policies(),
    card.summary(),
  ])

  console.log("Health:", health)
  console.log("Card:", { id: me.id, name: me.name, chain: me.chain, status: me.status })
  console.log("Limits:", limits)
  console.log("Policies:", policies)
  console.log("Summary:", {
    balance: summary.balance,
    spent: summary.spent,
    recentTransactions: summary.recentTransactions.length,
  })
}

main().catch((error) => {
  console.error("card-sdk example failed:", error)
  process.exitCode = 1
})
