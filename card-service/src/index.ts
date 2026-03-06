import { serve } from "@hono/node-server"
import { createApp } from "./app.js"
import { ConvexCardStore } from "./data/convex-store.js"
import { ZeroDevChainGateway } from "./lib/chain-gateway.js"
import dotenv from "dotenv";
dotenv.config();

function getEnv(name: string): string {
  const value = process.env[name]
  if (!value) {
    throw new Error(`Missing required env var: ${name}`)
  }
  return value
}

const port = Number(process.env.PORT ?? 8787)
const convexUrl = getEnv("CONVEX_URL")

const store = new ConvexCardStore(convexUrl)
const chainGateway = new ZeroDevChainGateway()
const app = createApp(store, chainGateway)

console.log(`card-service listening on http://localhost:${port}`)
serve({
  fetch: app.fetch,
  port,
})
