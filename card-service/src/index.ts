import { serve } from "@hono/node-server"
import { createApp } from "./app.js"
import { createSeedStore } from "./data/store.js"

const port = Number(process.env.PORT ?? 8787)
const store = createSeedStore()
const app = createApp(store)

console.log(`card-service listening on http://localhost:${port}`)
serve({
  fetch: app.fetch,
  port,
})
