import { ConvexHttpClient } from "convex/browser"
import type { ApiStore, ApiKeyContext } from "../types.js"

export class ConvexApiStore implements ApiStore {
  private client: ConvexHttpClient

  constructor(url: string) {
    this.client = new ConvexHttpClient(url)
  }

  async authenticateApiKey(apiKey: string): Promise<ApiKeyContext | null> {
    return this.client.mutation("apiService/service:authenticateApiKey" as any, {
      apiKey,
    }) as Promise<ApiKeyContext | null>
  }

  async logRequest(params: {
    apiKey: string
    method: string
    path: string
    statusCode: number
    durationMs: number
    requestId: string
  }): Promise<void> {
    await this.client.mutation("apiService/service:logApiRequest" as any, params)
  }

  async listAccounts(userId: string): Promise<unknown[]> {
    return this.client.query("apiService/service:listAccounts" as any, { userId }) as Promise<unknown[]>
  }

  async getAccount(userId: string, accountId: string): Promise<unknown> {
    return this.client.query("apiService/service:getAccount" as any, { userId, accountId }) as Promise<unknown>
  }

  async createAccount(userId: string, input: {
    name: string
    chain: string
    icon: string
    address: string
    privateKey: string
  }): Promise<unknown> {
    const id = await this.client.mutation("apiService/service:createAccount" as any, { userId, ...input }) as string
    return this.getAccount(userId, id)
  }

  async updateAccount(userId: string, accountId: string, input: { name?: string; icon?: string }): Promise<unknown> {
    return this.client.mutation("apiService/service:updateAccount" as any, {
      userId,
      accountId,
      ...input,
    }) as Promise<unknown>
  }

  async removeAccount(userId: string, accountId: string): Promise<{ ok: boolean }> {
    return this.client.mutation("apiService/service:removeAccount" as any, { userId, accountId }) as Promise<{ ok: boolean }>
  }

  async getAccountWithPrivateKey(userId: string, accountId: string): Promise<{
    _id: string
    address: string
    privateKey: string
    chain: string
  }> {
    return this.client.query("apiService/service:getAccountWithPrivateKey" as any, { userId, accountId }) as Promise<{
      _id: string
      address: string
      privateKey: string
      chain: string
    }>
  }

  async listContacts(userId: string): Promise<unknown[]> {
    return this.client.query("apiService/service:listContacts" as any, { userId }) as Promise<unknown[]>
  }

  async createContact(userId: string, input: { name: string; address: string }): Promise<unknown> {
    return this.client.mutation("apiService/service:createContact" as any, {
      userId,
      ...input,
    }) as Promise<unknown>
  }

  async removeContact(userId: string, contactId: string): Promise<{ ok: boolean }> {
    return this.client.mutation("apiService/service:removeContact" as any, { userId, contactId }) as Promise<{ ok: boolean }>
  }

  async listTransactionsByAccount(userId: string, accountId: string): Promise<unknown[]> {
    return this.client.query("apiService/service:listTransactionsByAccount" as any, {
      userId,
      accountId,
    }) as Promise<unknown[]>
  }

  async createTransaction(userId: string, input: {
    accountId: string
    hash: string
    from: string
    to: string
    value: string
    direction: string
    status: "progress" | "success" | "error"
    chain: string
  }): Promise<unknown> {
    return this.client.mutation("apiService/service:createTransaction" as any, {
      userId,
      ...input,
    }) as Promise<unknown>
  }

  async updateTransactionStatus(userId: string, transactionId: string, status: "progress" | "success" | "error"): Promise<unknown> {
    return this.client.mutation("apiService/service:updateTransactionStatus" as any, {
      userId,
      transactionId,
      status,
    }) as Promise<unknown>
  }

  async listCardsByAccount(userId: string, accountId: string): Promise<unknown[]> {
    return this.client.query("apiService/service:listCardsByAccount" as any, {
      userId,
      accountId,
    }) as Promise<unknown[]>
  }

  async getCard(userId: string, cardId: string): Promise<unknown> {
    return this.client.query("apiService/service:getCard" as any, { userId, cardId }) as Promise<unknown>
  }

  async createCard(userId: string, input: {
    accountId: string
    name: string
    secret: string
    limit?: string
    limitResetPeriod?: string
    policies?: Array<{ type: string; value: string }>
  }): Promise<unknown> {
    return this.client.mutation("apiService/service:createCard" as any, {
      userId,
      ...input,
    }) as Promise<unknown>
  }

  async updateCard(userId: string, cardId: string, input: {
    name?: string
    limit?: string
    status?: string
    limitResetPeriod?: string
    policies?: Array<{ type: string; value: string }>
  }): Promise<unknown> {
    return this.client.mutation("apiService/service:updateCard" as any, {
      userId,
      cardId,
      ...input,
    }) as Promise<unknown>
  }

  async removeCard(userId: string, cardId: string): Promise<{ ok: boolean }> {
    return this.client.mutation("apiService/service:removeCard" as any, { userId, cardId }) as Promise<{ ok: boolean }>
  }

  async listCardTransactions(userId: string, cardId: string): Promise<unknown[]> {
    return this.client.query("apiService/service:listCardTransactions" as any, {
      userId,
      cardId,
    }) as Promise<unknown[]>
  }

  async listIntegrationsByCard(userId: string, cardId: string): Promise<unknown[]> {
    return this.client.query("apiService/service:listIntegrationsByCard" as any, {
      userId,
      cardId,
    }) as Promise<unknown[]>
  }

  async createIntegration(userId: string, input: {
    cardId: string
    presetId: string
    type: string
    platform: string
    name: string
    description: string
    schemaVersion: number
    config?: Record<string, string>
  }): Promise<unknown> {
    return this.client.mutation("apiService/service:createIntegration" as any, {
      userId,
      ...input,
    }) as Promise<unknown>
  }

  async updateIntegrationConfig(userId: string, integrationId: string, input: { config?: Record<string, string> }): Promise<unknown> {
    return this.client.mutation("apiService/service:updateIntegrationConfig" as any, {
      userId,
      integrationId,
      ...input,
    }) as Promise<unknown>
  }

  async removeIntegration(userId: string, integrationId: string): Promise<{ ok: boolean }> {
    return this.client.mutation("apiService/service:removeIntegration" as any, {
      userId,
      integrationId,
    }) as Promise<{ ok: boolean }>
  }
}
