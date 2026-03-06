import { describe, expect, it } from "vitest";
import { createApp } from "../app.js";
const runtime = {
    card: {
        id: "card_1",
        accountId: "acc_1",
        name: "Bot",
        status: "active",
        chain: "sepolia",
        balanceAddress: "0x0000000000000000000000000000000000000001",
        spent: "0",
        limit: "1000",
        policies: [],
        createdAt: Date.now(),
    },
    account: {
        id: "acc_1",
        address: "0x0000000000000000000000000000000000000001",
        privateKey: "0x11",
        chain: "sepolia",
    },
};
function buildStore() {
    return {
        async getRuntimeBySecret(secret) {
            return secret === "sgl_test" ? runtime : null;
        },
        async listTransactions() {
            return [];
        },
        async prepareTransactionBySecret() {
            return { mode: "reserved", txId: "tx_1", hash: "pending:idem", status: "progress" };
        },
        async finalizePreparedTransactionBySecret() { },
        async saveTransactionBySecret() {
            return { txId: "tx_1" };
        },
        async setCardTransactionStatus() { },
        async setCardStatus(_secret, status) {
            return { status };
        },
    };
}
function buildGateway() {
    return {
        async getBalance() {
            return "2000";
        },
        async sendTransaction() {
            return { hash: "0xabc", status: "success" };
        },
        async waitForFinalStatus() {
            return { status: "success" };
        },
    };
}
describe("card-service app", () => {
    it("returns 401 for missing secret", async () => {
        const app = createApp(buildStore(), buildGateway());
        const res = await app.request("http://localhost/v1/card/me");
        expect(res.status).toBe(401);
    });
    it("returns card profile with valid secret", async () => {
        const app = createApp(buildStore(), buildGateway());
        const res = await app.request("http://localhost/v1/card/me", {
            headers: { "x-card-secret": "sgl_test" },
        });
        expect(res.status).toBe(200);
        const body = await res.json();
        expect(body.name).toBe("Bot");
    });
    it("creates transaction", async () => {
        const app = createApp(buildStore(), buildGateway());
        const res = await app.request("http://localhost/v1/card/transactions", {
            method: "POST",
            headers: {
                "content-type": "application/json",
                "x-card-secret": "sgl_test",
                "idempotency-key": "idem-1",
            },
            body: JSON.stringify({
                to: "0x0000000000000000000000000000000000000002",
                value: "10",
            }),
        });
        expect(res.status).toBe(201);
        const body = await res.json();
        expect(body.transaction.hash).toBe("0xabc");
    });
    it("rejects missing idempotency key", async () => {
        const app = createApp(buildStore(), buildGateway());
        const res = await app.request("http://localhost/v1/card/transactions", {
            method: "POST",
            headers: {
                "content-type": "application/json",
                "x-card-secret": "sgl_test",
            },
            body: JSON.stringify({
                to: "0x0000000000000000000000000000000000000002",
                value: "10",
            }),
        });
        expect(res.status).toBe(400);
    });
});
