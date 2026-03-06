import { describe, expect, it } from "vitest"

const API_SERVICE_BASE_URL = process.env.API_SERVICE_BASE_URL ?? "http://localhost:8788"
const API_KEY = process.env.API_SERVICE_TEST_KEY ?? "sgapi_kuotx8f7psk8zcwnmmf2jxs4"

async function request(path: string, init: RequestInit = {}) {
  const headers = new Headers(init.headers)
  if (path.startsWith("/v1/")) {
    headers.set("x-api-key", API_KEY)
  }

  return fetch(`${API_SERVICE_BASE_URL}${path}`, {
    ...init,
    headers,
  })
}

function randomHex(bytes: number) {
  return Array.from({ length: bytes }, () => Math.floor(Math.random() * 256).toString(16).padStart(2, "0")).join("")
}

function randomAddress() {
  return `0x${randomHex(20)}`
}

function hasScope(scopes: string[], scope: "read" | "write" | "tx" | "admin") {
  return scopes.includes("admin") || scopes.includes(scope)
}

const runIntegration = process.env.RUN_INTEGRATION_TESTS === "true"

describe.runIf(runIntegration)("api-service integration", () => {
  it("responds to health and openapi", async () => {
    const healthResponse = await request("/health")
    expect(healthResponse.status).toBe(200)
    const healthJson = await healthResponse.json()
    expect(healthJson).toMatchObject({ ok: true, service: "api-service" })

    const openApiResponse = await request("/openapi.json")
    expect(openApiResponse.status).toBe(200)
    const openApiJson = await openApiResponse.json()
    expect(openApiJson).toMatchObject({ openapi: "3.1.0" })
  })

  it("covers every /v1 endpoint with scope-aware assertions", async () => {
    let createdAccountId: string | undefined
    let createdCardId: string | undefined
    let createdIntegrationId: string | undefined
    let createdContactId: string | undefined

    const me = await request("/v1/me")
    expect(me.status).toBe(200)
    const meJson = await me.json() as { scopes: string[] }
    const scopes = meJson.scopes ?? []

    const canRead = hasScope(scopes, "read")
    const canWrite = hasScope(scopes, "write")
    const canTx = hasScope(scopes, "tx")
    const canAdmin = hasScope(scopes, "admin")

    const listKeys = await request("/v1/api-keys")
    expect(listKeys.status).toBe(canAdmin ? 200 : 403)

    const createKey = await request("/v1/api-keys", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ name: `integration-key-${Date.now()}`, scopes: ["read"] }),
    })
    expect(createKey.status).toBe(canAdmin ? 201 : 403)

    const patchKey = await request("/v1/api-keys/fake", {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ name: `updated-${Date.now()}` }),
    })
    expect(patchKey.status).toBe(canAdmin ? 500 : 403)

    const deleteKey = await request("/v1/api-keys/fake", {
      method: "DELETE",
    })
    expect(deleteKey.status).toBe(canAdmin ? 500 : 403)

    const listAccounts = await request("/v1/accounts")
    expect(listAccounts.status).toBe(canRead ? 200 : 403)

    if (canWrite) {
      const createAccount = await request("/v1/accounts", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          name: `integration-account-${Date.now()}`,
          chain: "sepolia",
          icon: "wallet",
          address: randomAddress(),
          privateKey: `0x${randomHex(32)}`,
        }),
      })
      expect(createAccount.status).toBe(201)
      const createAccountJson = await createAccount.json()
      createdAccountId = createAccountJson.account._id
      expect(createdAccountId).toBeTruthy()
    } else {
      const createAccount = await request("/v1/accounts", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          name: `integration-account-${Date.now()}`,
          chain: "sepolia",
          icon: "wallet",
          address: randomAddress(),
          privateKey: `0x${randomHex(32)}`,
        }),
      })
      expect(createAccount.status).toBe(403)
    }

    const provisionInvalid = await request("/v1/accounts/provision", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({}),
    })
    expect(provisionInvalid.status).toBe(canTx ? 400 : 403)

    if (createdAccountId) {
      const getAccount = await request(`/v1/accounts/${createdAccountId}`)
      expect(getAccount.status).toBe(canRead ? 200 : 403)

      const patchAccount = await request(`/v1/accounts/${createdAccountId}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ name: `patched-${Date.now()}` }),
      })
      expect(patchAccount.status).toBe(canWrite ? 200 : 403)

      const listAccountTx = await request(`/v1/accounts/${createdAccountId}/transactions`)
      expect(listAccountTx.status).toBe(canRead ? 200 : 403)

      const sendTxWithoutIdempotency = await request(`/v1/accounts/${createdAccountId}/transactions`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ to: randomAddress(), value: "1" }),
      })
      expect(sendTxWithoutIdempotency.status).toBe(canTx ? 400 : 403)

      const listAccountCards = await request(`/v1/accounts/${createdAccountId}/cards`)
      expect(listAccountCards.status).toBe(canRead ? 200 : 403)

      if (canWrite) {
        const createCard = await request("/v1/cards", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            accountId: createdAccountId,
            name: `integration-card-${Date.now()}`,
            secret: `sgl_${Date.now()}`,
          }),
        })
        expect(createCard.status).toBe(201)
        const createCardJson = await createCard.json()
        createdCardId = createCardJson.card._id
        expect(createdCardId).toBeTruthy()
      }
    }

    if (createdCardId) {
      const getCard = await request(`/v1/cards/${createdCardId}`)
      expect(getCard.status).toBe(canRead ? 200 : 403)

      const patchCard = await request(`/v1/cards/${createdCardId}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ name: `patched-card-${Date.now()}` }),
      })
      expect(patchCard.status).toBe(canWrite ? 200 : 403)

      const listCardTx = await request(`/v1/cards/${createdCardId}/transactions`)
      expect(listCardTx.status).toBe(canRead ? 200 : 403)

      const listCardIntegrations = await request(`/v1/cards/${createdCardId}/integrations`)
      expect(listCardIntegrations.status).toBe(canRead ? 200 : 403)

      if (canWrite) {
        const createIntegration = await request("/v1/integrations", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            cardId: createdCardId,
            presetId: `preset-${Date.now()}`,
            type: "custom",
            platform: "custom",
            name: `integration-${Date.now()}`,
            description: "integration test",
            schemaVersion: 1,
            config: { language: "ts" },
          }),
        })
        expect(createIntegration.status).toBe(201)
        const createIntegrationJson = await createIntegration.json()
        createdIntegrationId = createIntegrationJson.integration._id
        expect(createdIntegrationId).toBeTruthy()

        const patchIntegration = await request(`/v1/integrations/${createdIntegrationId}`, {
          method: "PATCH",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ config: { endpointBaseUrl: "https://example.com" } }),
        })
        expect(patchIntegration.status).toBe(200)
      }
    }

    const listContacts = await request("/v1/contacts")
    expect(listContacts.status).toBe(canRead ? 200 : 403)

    if (canWrite) {
      const createContact = await request("/v1/contacts", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          name: `contact-${Date.now()}`,
          address: randomAddress(),
        }),
      })
      expect(createContact.status).toBe(201)
      const createContactJson = await createContact.json()
      createdContactId = createContactJson.contact._id
      expect(createdContactId).toBeTruthy()
    }

    if (createdContactId) {
      const removeContact = await request(`/v1/contacts/${createdContactId}`, {
        method: "DELETE",
      })
      expect(removeContact.status).toBe(canWrite ? 200 : 403)
    }

    if (createdIntegrationId) {
      const removeIntegration = await request(`/v1/integrations/${createdIntegrationId}`, {
        method: "DELETE",
      })
      expect(removeIntegration.status).toBe(canWrite ? 200 : 403)
    }

    if (createdCardId) {
      const removeCard = await request(`/v1/cards/${createdCardId}`, {
        method: "DELETE",
      })
      expect(removeCard.status).toBe(canWrite ? 200 : 403)
    }

    if (createdAccountId) {
      const removeAccount = await request(`/v1/accounts/${createdAccountId}`, {
        method: "DELETE",
      })
      expect(removeAccount.status).toBe(canWrite ? 200 : 403)
    }
  }, 120000)

  it("rejects requests with invalid api key", async () => {
    const response = await fetch(`${API_SERVICE_BASE_URL}/v1/me`, {
      headers: {
        "x-api-key": "sgapi_invalid",
      },
    })

    expect(response.status).toBe(401)
    const payload = await response.json()
    expect(payload).toMatchObject({
      error: {
        code: "INVALID_API_KEY",
      },
    })
  })
})
