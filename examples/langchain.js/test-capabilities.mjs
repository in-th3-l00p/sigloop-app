import "dotenv/config"
import { createCardClient } from "@sigloop/card"
import { runAgent } from "./agent.mjs"

const card = createCardClient({
  baseUrl: process.env.CARD_BASE_URL ?? "http://localhost:8787",
  cardSecret: process.env.CARD_SECRET,
})

function assertTool(trace, toolName) {
  if (!trace.some((step) => step.name === toolName)) {
    throw new Error(`Expected tool call not found: ${toolName}`)
  }
}

function randomAddress() {
  const chars = "0123456789abcdef"
  let out = "0x"
  for (let i = 0; i < 40; i += 1) {
    out += chars[Math.floor(Math.random() * chars.length)]
  }
  return out
}

async function main() {
  console.log("1) Baseline read tools...")
  const baseline = await runAgent(
    "Call card_profile, card_limits_and_policies, card_list_transactions, api_overview, api_accounts, and api_contacts. Then summarize in 4 bullets.",
  )
  assertTool(baseline.trace, "card_profile")
  assertTool(baseline.trace, "card_limits_and_policies")
  assertTool(baseline.trace, "card_list_transactions")
  assertTool(baseline.trace, "api_overview")
  assertTool(baseline.trace, "api_accounts")
  assertTool(baseline.trace, "api_contacts")

  const me = await card.me()
  const selfAddress = me.accountAddress

  console.log("2) Live 1-wei transaction through agent...")
  const sendTx = await runAgent(
    `Use card_send_transaction to send exactly 1 wei to ${selfAddress} with description \"agent capability test\". Then call card_list_transactions with limit 3 and summarize.`,
  )
  assertTool(sendTx.trace, "card_send_transaction")
  assertTool(sendTx.trace, "card_list_transactions")

  console.log("3) Limit hit test through quote...")
  const limitHit = await runAgent(
    `Use card_quote_transaction with to=${selfAddress} and valueWei=20000000000000000. Then explain why it fails or succeeds.`,
  )
  assertTool(limitHit.trace, "card_quote_transaction")

  console.log("4) Pause, blocked send, and resume...")
  const pauseFlow = await runAgent(
    `Call card_pause. Then call card_send_transaction with to=${selfAddress} and valueWei=1. Then call card_resume. Explain the observed behavior of each step.`,
  )
  assertTool(pauseFlow.trace, "card_pause")
  assertTool(pauseFlow.trace, "card_send_transaction")
  assertTool(pauseFlow.trace, "card_resume")

  console.log("5) API write tool roundtrip (create + delete contact)...")
  const contactAddress = randomAddress()
  const createContact = await runAgent(
    `Call api_create_contact with name \"Agent Temp Contact\" and address \"${contactAddress}\". Return only the created id.`,
  )
  assertTool(createContact.trace, "api_create_contact")

  const createdStep = createContact.trace.find((step) => step.name === "api_create_contact" && step.ok)
  if (!createdStep) {
    throw new Error("api_create_contact did not succeed")
  }
  const createdPayload = JSON.parse(createdStep.content)
  const contactId = createdPayload?.contact?._id
  if (!contactId) {
    throw new Error("Could not parse created contact id from api_create_contact result")
  }

  const deleteContact = await runAgent(`Call api_delete_contact with contactId \"${contactId}\". Then confirm success.`)
  assertTool(deleteContact.trace, "api_delete_contact")

  console.log("All agent capability checks passed.")
}

main().catch((error) => {
  console.error("agent capability test failed:", error)
  process.exitCode = 1
})
