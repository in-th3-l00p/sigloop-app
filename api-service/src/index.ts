import { serve } from "@hono/node-server"
import { createApp } from "./app.js"
import { ConvexApiStore } from "./data/convex-store.js"

function getEnv(name: string): string {
  const value = process.env[name]
  if (!value) {
    throw new Error(`Missing required env var: ${name}`)
  }
  return value
}

const port = Number(process.env.PORT ?? 8788)
const convexUrl = getEnv("CONVEX_URL")

const store = new ConvexApiStore(convexUrl)
const app = createApp(store)

console.log(`api-service listening on http://localhost:${port}`)
serve({
  fetch: app.fetch,
  port,
})
