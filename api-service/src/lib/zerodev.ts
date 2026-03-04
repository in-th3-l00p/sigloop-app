import { createPublicClient, http, type Hex } from "viem"
import { entryPoint07Address } from "viem/account-abstraction"
import { generatePrivateKey, privateKeyToAccount } from "viem/accounts"
import { signerToEcdsaValidator } from "@zerodev/ecdsa-validator"
import { createKernelAccount, createKernelAccountClient } from "@zerodev/sdk"
import { getChainConfig } from "./chains.js"

const KERNEL_VERSION = "0.3.1"
const ENTRY_POINT = {
  address: entryPoint07Address,
  version: "0.7",
} as const

async function buildKernelClient(chainSlug: string, privateKey: Hex) {
  const { chain, rpcUrl } = getChainConfig(chainSlug)
  const signer = privateKeyToAccount(privateKey)

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

  return { account, kernelClient }
}

export async function provisionSmartAccount(chainSlug: string): Promise<{ address: Hex; privateKey: Hex }> {
  const privateKey = generatePrivateKey()
  const { account } = await buildKernelClient(chainSlug, privateKey)
  return { address: account.address, privateKey }
}

export async function sendKernelTransaction(params: {
  chainSlug: string
  privateKey: Hex
  to: Hex
  value: bigint
}): Promise<{ hash: Hex; status: "progress" | "success" }> {
  const { account, kernelClient } = await buildKernelClient(params.chainSlug, params.privateKey)

  const hash = await kernelClient.sendUserOperation({
    callData: await account.encodeCalls([
      {
        to: params.to,
        value: params.value,
        data: "0x",
      },
    ]),
  })

  return { hash, status: "progress" }
}

export async function waitKernelFinality(params: {
  chainSlug: string
  privateKey: Hex
  hash: Hex
  timeoutMs?: number
}): Promise<"success" | "error"> {
  try {
    const { kernelClient } = await buildKernelClient(params.chainSlug, params.privateKey)

    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error("Timeout waiting for user operation receipt")), params.timeoutMs ?? 120000),
    )

    const receipt = await Promise.race<any>([
      kernelClient.waitForUserOperationReceipt({ hash: params.hash }),
      timeoutPromise,
    ])

    return receipt.receipt.status === "success" ? "success" : "error"
  } catch {
    return "error"
  }
}
