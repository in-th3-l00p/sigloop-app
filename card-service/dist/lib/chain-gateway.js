import { createPublicClient, http } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { entryPoint07Address } from "viem/account-abstraction";
import { signerToEcdsaValidator } from "@zerodev/ecdsa-validator";
import { createKernelAccount, createKernelAccountClient } from "@zerodev/sdk";
import { ApiError } from "./errors.js";
import { getChainConfig } from "./chains.js";
const ENTRY_POINT = {
    address: entryPoint07Address,
    version: "0.7",
};
const KERNEL_VERSION = "0.3.1";
export class ZeroDevChainGateway {
    async buildKernelClient(chainSlug, privateKey) {
        const { chain, rpcUrl } = getChainConfig(chainSlug);
        const signer = privateKeyToAccount(privateKey);
        const publicClient = createPublicClient({
            chain,
            transport: http(rpcUrl),
        });
        const ecdsaValidator = await signerToEcdsaValidator(publicClient, {
            signer,
            entryPoint: ENTRY_POINT,
            kernelVersion: KERNEL_VERSION,
        });
        const account = await createKernelAccount(publicClient, {
            plugins: { sudo: ecdsaValidator },
            entryPoint: ENTRY_POINT,
            kernelVersion: KERNEL_VERSION,
        });
        const kernelClient = createKernelAccountClient({
            account,
            chain,
            bundlerTransport: http(rpcUrl),
        });
        return { account, kernelClient };
    }
    async getBalance(chainSlug, address) {
        const { chain, rpcUrl } = getChainConfig(chainSlug);
        const client = createPublicClient({ chain, transport: http(rpcUrl) });
        const balance = await client.getBalance({ address: address });
        return balance.toString();
    }
    async sendTransaction(params) {
        const { account, kernelClient } = await this.buildKernelClient(params.chainSlug, params.privateKey);
        try {
            const userOpHash = await kernelClient.sendUserOperation({
                callData: await account.encodeCalls([
                    {
                        to: params.to,
                        value: BigInt(params.value),
                        data: "0x",
                    },
                ]),
            });
            try {
                const receipt = await kernelClient.waitForUserOperationReceipt({ hash: userOpHash });
                const txHash = receipt.receipt.transactionHash || userOpHash;
                return { hash: txHash, status: "success" };
            }
            catch {
                return { hash: userOpHash, status: "progress" };
            }
        }
        catch (error) {
            throw new ApiError(502, "CHAIN_SEND_FAILED", error instanceof Error ? error.message : "Failed to send user operation");
        }
    }
    async waitForFinalStatus(params) {
        try {
            const { kernelClient } = await this.buildKernelClient(params.chainSlug, params.privateKey);
            const timeoutMs = params.timeoutMs ?? 120000;
            const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error("Timeout waiting for user operation receipt")), timeoutMs));
            const receipt = await Promise.race([
                kernelClient.waitForUserOperationReceipt({ hash: params.hash }),
                timeoutPromise,
            ]);
            const txHash = receipt.receipt.transactionHash || undefined;
            const ok = receipt.receipt.status === "success";
            return { status: ok ? "success" : "error", finalHash: txHash };
        }
        catch {
            return { status: "error" };
        }
    }
}
