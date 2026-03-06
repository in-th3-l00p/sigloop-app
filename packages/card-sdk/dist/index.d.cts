type CardStatus = "active" | "paused";
type TransactionStatus = "progress" | "success" | "error";
interface CardPolicy {
    type: string;
    value: string;
}
interface CardTransaction {
    id?: string;
    hash: string;
    from: string;
    to: string;
    value: string;
    direction: "in" | "out" | string;
    status: TransactionStatus;
    chain: string;
    createdAt?: number;
    description?: string;
}
interface CardProfile {
    id: string;
    accountId: string;
    accountAddress: string;
    name: string;
    status: CardStatus;
    chain: string;
    createdAt: number;
}
interface CardBalance {
    balance: string;
    currency: string;
    chain: string;
    spent: string;
}
interface CardLimits {
    limit: string | null;
    spent: string;
    remaining: string | null;
    resetPeriod: string | null;
    resetAt: number | null;
}
interface CardSummary {
    card: {
        id: string;
        name: string;
        status: CardStatus;
    };
    balance: string;
    limit: string | null;
    spent: string;
    recentTransactions: CardTransaction[];
}
interface QuoteTransactionInput {
    to: string;
    value: string;
    description?: string;
}
interface QuoteTransactionResponse {
    allowed: boolean;
    quote: {
        amount: string;
        networkFee: string;
        total: string;
    };
}
interface CreateTransactionInput {
    to: string;
    value: string;
    description?: string;
}
interface CreateTransactionOptions {
    idempotencyKey?: string;
}
interface ListTransactionsQuery {
    limit?: number;
}
interface RequestContext {
    path: string;
    method: string;
    url: string;
    headers: Headers;
}
interface CardClientOptions {
    baseUrl: string;
    cardSecret?: string;
    timeoutMs?: number;
    fetch?: typeof fetch;
    headers?: Record<string, string>;
    idempotencyKeyFactory?: () => string;
    beforeRequest?: (context: RequestContext) => void | Promise<void>;
    afterResponse?: (context: RequestContext, response: Response) => void | Promise<void>;
}

declare class CardApiError extends Error {
    status: number;
    code?: string;
    details?: unknown;
    constructor(message: string, status: number, code?: string, details?: unknown);
}
declare class CardTimeoutError extends Error {
    constructor(message?: string);
}
declare class CardNetworkError extends Error {
    constructor(message?: string);
}

declare class CardClient {
    private readonly baseUrl;
    private readonly cardSecret?;
    private readonly timeoutMs;
    private readonly fetchImpl;
    private readonly headers?;
    private readonly idempotencyKeyFactory;
    private readonly beforeRequest?;
    private readonly afterResponse?;
    constructor(options: CardClientOptions);
    private request;
    health(): Promise<{
        ok: boolean;
        service: string;
    }>;
    openApi(): Promise<unknown>;
    me(): Promise<CardProfile>;
    balance(): Promise<CardBalance>;
    limits(): Promise<CardLimits>;
    policies(): Promise<{
        policies: CardPolicy[];
    }>;
    summary(): Promise<CardSummary>;
    transactions(query?: ListTransactionsQuery): Promise<{
        transactions: CardTransaction[];
    }>;
    quoteTransaction(input: QuoteTransactionInput): Promise<QuoteTransactionResponse>;
    createTransaction(input: CreateTransactionInput, options?: CreateTransactionOptions): Promise<{
        transaction: CardTransaction;
        idempotentReplay?: boolean;
    }>;
    pause(): Promise<{
        status: "paused";
    }>;
    resume(): Promise<{
        status: "active";
    }>;
}
declare function createCardClient(options: CardClientOptions): CardClient;

export { CardApiError, type CardBalance, CardClient, type CardClientOptions, type CardLimits, CardNetworkError, type CardPolicy, type CardProfile, type CardStatus, type CardSummary, CardTimeoutError, type CardTransaction, type CreateTransactionInput, type CreateTransactionOptions, type ListTransactionsQuery, type QuoteTransactionInput, type QuoteTransactionResponse, type RequestContext, type TransactionStatus, createCardClient };
