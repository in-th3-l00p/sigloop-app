import { createPublicClient, http, type Address } from "viem"
import { privateKeyToAccount } from "viem/accounts"
import { entryPoint07Address } from "viem/account-abstraction"
import { signerToEcdsaValidator } from "@zerodev/ecdsa-validator"
import { createKernelAccount, createKernelAccountClient } from "@zerodev/sdk"
import { ApiError } from "./errors.js"
import { getChainConfig } from "./chains.js"
import type { ChainGateway } from "../types.js"

const ENTRY_POINT = {
  address: entryPoint07Address,
  version: "0.7" as const,
}

const KERNEL_VERSION = "0.3.1" as const

export class ZeroDevChainGateway implements ChainGateway {
  async getBalance(chainSlug: string, address: string): Promise<string> {
    const { chain, rpcUrl } = getChainConfig(chainSlug)
    const client = createPublicClient({ chain, transport: http(rpcUrl) })
    const balance = await client.getBalance({ address: address as Address })
    return balance.toString()
  }

  async sendTransaction(params: {
    chainSlug: string
    privateKey: string
    to: string
    value: string
  }): Promise<{ hash: string; status: "pending" | "confirmed" }> {
    const { chain, rpcUrl } = getChainConfig(params.chainSlug)
    const signer = privateKeyToAccount(params.privateKey as Address)

    const publicClient = createPublicClient({
      chain,
      transport: http(rpcUrl),
    })

    const ecdsaValidator = await signerToEcdsaValidator(publicClient, {
      signer,
      entryPoint: ENTRY_POINT,
      kernelVersion: KERNEL_VERSION,
    })

    const account = await createKernelAccount(publicClient, {
      plugins: { sudo: ecdsaValidator },
      entryPoint: ENTRY_POINT,
      kernelVersion: KERNEL_VERSION,
    })

    const kernelClient = createKernelAccountClient({
      account,
      chain,
      bundlerTransport: http(rpcUrl),
    })

    try {
      const userOpHash = await kernelClient.sendUserOperation({
        callData: await account.encodeCalls([
          {
            to: params.to as Address,
            value: BigInt(params.value),
            data: "0x",
          },
        ]),
      })

      try {
        const receipt = await kernelClient.waitForUserOperationReceipt({ hash: userOpHash })
        const txHash = receipt.receipt.transactionHash || userOpHash
        return { hash: txHash, status: "confirmed" }
      } catch {
        return { hash: userOpHash, status: "pending" }
      }
    } catch (error) {
      throw new ApiError(502, "CHAIN_SEND_FAILED", error instanceof Error ? error.message : "Failed to send user operation")
    }
  }
}
