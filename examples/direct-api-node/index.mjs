import dotenv from "dotenv"
import { fetch } from "undici"

dotenv.config({ path: new URL(".env.local", import.meta.url).pathname, quiet: true })
dotenv.config({ quiet: true })

const baseUrl = process.env.SIGLOOP_CARD_SERVICE_URL ?? "https://card.sigloop.online"
const cardSecret = process.env.SIGLOOP_CARD_SECRET

async function req(path, init = {}) {
  const headers = {
    "content-type": "application/json",
    "x-card-secret": cardSecret,
    ...(init.headers ?? {}),
  }
  const res = await fetch(`${baseUrl}${path}`, { ...init, headers })
  const body = await res.text()
  if (!res.ok) throw new Error(`${res.status} ${body}`)
  return body ? JSON.parse(body) : {}
}

const me = await req("/v1/card/me")
const summary = await req("/v1/card/summary")
console.log(JSON.stringify({ me, summary }, null, 2))
