import { describe, expect, it } from "vitest";
import { enforceLimitsAndPolicies } from "../lib/policies.js";
const baseCard = {
    id: "card_1",
    accountId: "acc_1",
    name: "Bot",
    status: "active",
    chain: "sepolia",
    balanceAddress: "0x0000000000000000000000000000000000000001",
    spent: "100",
    limit: "1000",
    policies: [],
    createdAt: Date.now(),
};
describe("enforceLimitsAndPolicies", () => {
    it("allows valid amount under limits", () => {
        expect(() => enforceLimitsAndPolicies(baseCard, { to: "0x0000000000000000000000000000000000000002", value: "50" })).not.toThrow();
    });
    it("blocks when card limit is exceeded", () => {
        expect(() => enforceLimitsAndPolicies(baseCard, { to: "0x0000000000000000000000000000000000000002", value: "901" })).toThrow(/limit/i);
    });
    it("blocks invalid recipient policy", () => {
        const card = {
            ...baseCard,
            policies: [{ type: "allowedRecipient", value: "0x0000000000000000000000000000000000000009" }],
        };
        expect(() => enforceLimitsAndPolicies(card, { to: "0x0000000000000000000000000000000000000002", value: "10" })).toThrow(/Recipient/i);
    });
});
