import "dotenv/config"
import { createApiClient } from "@sigloop/api"

const api = createApiClient({
  baseUrl: process.env.API_BASE_URL ?? "http://localhost:8788",
  apiKey: process.env.API_KEY ?? "sgapi_kuotx8f7psk8zcwnmmf2jxs4",
})

async function main() {
  const [health, me, accounts, contacts] = await Promise.all([
    api.health(),
    api.me(),
    api.listAccounts(),
    api.listContacts(),
  ])

  console.log("Health:", health)
  console.log("API key context:", {
    userId: me.userId,
    keyName: me.keyName,
    scopes: me.scopes,
  })
  console.log("Accounts:", accounts.accounts.length)
  console.log("Contacts:", contacts.contacts.length)
}

main().catch((error) => {
  console.error("api-sdk example failed:", error)
  process.exitCode = 1
})
