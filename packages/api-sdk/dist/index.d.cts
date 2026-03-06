type ApiScope = "read" | "write" | "tx" | "admin";
type ApiKeyStatus = "active" | "paused" | "revoked";
type TxStatus = "progress" | "success" | "error";
interface ApiAuthContext {
    ok: true;
    apiKeyId: string;
    userId: string;
    keyName: string;
    keyPrefix: string;
    scopes: string[];
    ipAllowlist: string[];
    rateLimitPerMinute: number;
}
interface ApiKey {
    _id?: string;
    id?: string;
    userId?: string;
    name: string;
    keyPrefix: string;
    scopes: string[];
    ipAllowlist?: string[];
    rateLimitPerMinute?: number;
    status: ApiKeyStatus;
    createdAt?: number;
    lastUsedAt?: number;
    revokedAt?: number;
    apiKey?: string;
}
interface SmartAccount {
    _id: string;
    userId?: string;
    name: string;
    chain: string;
    icon: string;
    address: string;
    status?: string;
    createdAt: number;
}
interface Transaction {
    _id?: string;
    userId?: string;
    accountId?: string;
    agentCardId?: string;
    idempotencyKey?: string;
    hash: string;
    from: string;
    to: string;
    value: string;
    direction: string;
    status: TxStatus;
    chain: string;
    createdAt?: number;
}
interface CardPolicy {
    type: string;
    value: string;
}
interface Card {
    _id: string;
    userId?: string;
    accountId: string;
    name: string;
    secret: string;
    limit?: string;
    spent: string;
    status: string;
    limitResetPeriod?: string;
    limitResetAt?: number;
    policies?: CardPolicy[];
    createdAt: number;
}
interface IntegrationConfig {
    secretRef?: string;
    language?: string;
    packageManager?: string;
    endpointBaseUrl?: string;
    toolLibrary?: string;
    agentPurpose?: string;
    taskScope?: string;
    behavioralRules?: string;
    escalationPolicy?: string;
    [key: string]: string | undefined;
}
interface Integration {
    _id: string;
    userId?: string;
    cardId: string;
    presetId: string;
    type: string;
    platform: string;
    name: string;
    description: string;
    status: string;
    schemaVersion: number;
    verificationMessage?: string;
    verifiedAt?: number;
    config?: IntegrationConfig;
    createdAt: number;
    updatedAt: number;
}
interface Contact {
    _id: string;
    userId?: string;
    name: string;
    address: string;
}
interface CreateApiKeyInput {
    name: string;
    scopes?: ApiScope[];
    ipAllowlist?: string[];
    rateLimitPerMinute?: number;
}
interface UpdateApiKeyPolicyInput {
    name?: string;
    scopes?: ApiScope[];
    ipAllowlist?: string[];
    rateLimitPerMinute?: number;
}
interface CreateAccountInput {
    name: string;
    chain: string;
    icon: string;
    address: string;
    privateKey: string;
}
interface ProvisionAccountInput {
    name: string;
    chain: string;
    icon?: string;
}
interface UpdateAccountInput {
    name?: string;
    icon?: string;
}
interface SendTransactionInput {
    to: string;
    value: string;
}
interface SendTransactionOptions {
    idempotencyKey?: string;
}
interface CreateCardInput {
    accountId: string;
    name: string;
    secret: string;
    limit?: string;
    limitResetPeriod?: string;
    policies?: CardPolicy[];
}
interface UpdateCardInput {
    name?: string;
    limit?: string;
    status?: string;
    limitResetPeriod?: string;
    policies?: CardPolicy[];
}
interface CreateIntegrationInput {
    cardId: string;
    presetId: string;
    type: string;
    platform: string;
    name: string;
    description: string;
    schemaVersion: number;
    config?: IntegrationConfig;
}
interface UpdateIntegrationInput {
    config?: IntegrationConfig;
}
interface CreateContactInput {
    name: string;
    address: string;
}
interface RequestContext {
    path: string;
    method: string;
    url: string;
    headers: Headers;
}
interface ApiClientOptions {
    baseUrl: string;
    apiKey?: string;
    timeoutMs?: number;
    fetch?: typeof fetch;
    headers?: Record<string, string>;
    idempotencyKeyFactory?: () => string;
    beforeRequest?: (context: RequestContext) => void | Promise<void>;
    afterResponse?: (context: RequestContext, response: Response) => void | Promise<void>;
}

declare class ApiApiError extends Error {
    status: number;
    code?: string;
    details?: unknown;
    constructor(message: string, status: number, code?: string, details?: unknown);
}
declare class ApiTimeoutError extends Error {
    constructor(message?: string);
}
declare class ApiNetworkError extends Error {
    constructor(message?: string);
}

declare class ApiClient {
    private readonly baseUrl;
    private readonly apiKey?;
    private readonly timeoutMs;
    private readonly fetchImpl;
    private readonly headers?;
    private readonly idempotencyKeyFactory;
    private readonly beforeRequest?;
    private readonly afterResponse?;
    constructor(options: ApiClientOptions);
    private request;
    health(): Promise<{
        ok: boolean;
        service: string;
    }>;
    openApi(): Promise<unknown>;
    me(): Promise<ApiAuthContext>;
    listApiKeys(): Promise<{
        apiKeys: ApiKey[];
    }>;
    createApiKey(input: CreateApiKeyInput): Promise<{
        apiKey: ApiKey;
    }>;
    updateApiKeyPolicy(apiKeyId: string, input: UpdateApiKeyPolicyInput): Promise<{
        apiKey: ApiKey;
    }>;
    revokeApiKey(apiKeyId: string): Promise<{
        ok: boolean;
    }>;
    listAccounts(): Promise<{
        accounts: SmartAccount[];
    }>;
    createAccount(input: CreateAccountInput): Promise<{
        account: SmartAccount;
    }>;
    provisionAccount(input: ProvisionAccountInput): Promise<{
        account: SmartAccount;
    }>;
    getAccount(accountId: string): Promise<{
        account: SmartAccount;
    }>;
    updateAccount(accountId: string, input: UpdateAccountInput): Promise<{
        account: SmartAccount;
    }>;
    removeAccount(accountId: string): Promise<{
        ok: boolean;
    }>;
    listAccountTransactions(accountId: string): Promise<{
        transactions: Transaction[];
    }>;
    sendTransaction(accountId: string, input: SendTransactionInput, options?: SendTransactionOptions): Promise<{
        transaction: Transaction;
    }>;
    listAccountCards(accountId: string): Promise<{
        cards: Card[];
    }>;
    createCard(input: CreateCardInput): Promise<{
        card: Card;
    }>;
    getCard(cardId: string): Promise<{
        card: Card;
    }>;
    updateCard(cardId: string, input: UpdateCardInput): Promise<{
        card: Card;
    }>;
    removeCard(cardId: string): Promise<{
        ok: boolean;
    }>;
    listCardTransactions(cardId: string): Promise<{
        transactions: Transaction[];
    }>;
    listCardIntegrations(cardId: string): Promise<{
        integrations: Integration[];
    }>;
    createIntegration(input: CreateIntegrationInput): Promise<{
        integration: Integration;
    }>;
    updateIntegration(integrationId: string, input: UpdateIntegrationInput): Promise<{
        integration: Integration;
    }>;
    removeIntegration(integrationId: string): Promise<{
        ok: boolean;
    }>;
    listContacts(): Promise<{
        contacts: Contact[];
    }>;
    createContact(input: CreateContactInput): Promise<{
        contact: Contact;
    }>;
    removeContact(contactId: string): Promise<{
        ok: boolean;
    }>;
}
declare function createApiClient(options: ApiClientOptions): ApiClient;

export { ApiApiError, type ApiAuthContext, ApiClient, type ApiClientOptions, type ApiKey, type ApiKeyStatus, ApiNetworkError, type ApiScope, ApiTimeoutError, type Card, type CardPolicy, type Contact, type CreateAccountInput, type CreateApiKeyInput, type CreateCardInput, type CreateContactInput, type CreateIntegrationInput, type Integration, type IntegrationConfig, type ProvisionAccountInput, type RequestContext, type SendTransactionInput, type SendTransactionOptions, type SmartAccount, type Transaction, type TxStatus, type UpdateAccountInput, type UpdateApiKeyPolicyInput, type UpdateCardInput, type UpdateIntegrationInput, createApiClient };
