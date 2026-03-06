import { createPublicClient, http, type Hex } from "viem"
import { generatePrivateKey, privateKeyToAccount } from "viem/accounts"
import { entryPoint07Address } from "viem/account-abstraction"
import { signerToEcdsaValidator } from "@zerodev/ecdsa-validator"
import { createKernelAccount, createKernelAccountClient } from "@zerodev/sdk"
import { getChainConfig } from "./chains"

const KERNEL_V3_1 = "0.3.1"

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
    kernelVersion: KERNEL_V3_1,
  })

  const account = await createKernelAccount(publicClient, {
    plugins: { sudo: ecdsaValidator },
    entryPoint: ENTRY_POINT,
    kernelVersion: KERNEL_V3_1,
  })

  const kernelClient = createKernelAccountClient({
    account,
    chain,
    bundlerTransport: http(rpcUrl),
  })

  return { account, kernelClient }
}

export async function createSmartAccount(chainSlug: string): Promise<{ address: Hex; privateKey: Hex }> {
  const { chain, rpcUrl } = getChainConfig(chainSlug)
  const privateKey = generatePrivateKey()
  const signer = privateKeyToAccount(privateKey)

  const publicClient = createPublicClient({
    chain,
    transport: http(rpcUrl),
  })

  const ecdsaValidator = await signerToEcdsaValidator(publicClient, {
    signer,
    entryPoint: ENTRY_POINT,
    kernelVersion: KERNEL_V3_1,
  })

  const account = await createKernelAccount(publicClient, {
    plugins: { sudo: ecdsaValidator },
    entryPoint: ENTRY_POINT,
    kernelVersion: KERNEL_V3_1,
  })

  return {
    address: account.address,
    privateKey,
  }
}

export async function sendTransaction({
  chainSlug,
  privateKey,
  to,
  value,
}: {
  chainSlug: string
  privateKey: Hex
  to: Hex
  value: bigint
}): Promise<{ txHash: Hex }> {
  const { account, kernelClient } = await buildKernelClient(chainSlug, privateKey)

  const txHash = await kernelClient.sendUserOperation({
    callData: await account.encodeCalls([
      {
        to,
        value,
        data: "0x",
      },
    ]),
  })

  return { txHash }
}

export async function waitForUserOpFinality({
  chainSlug,
  privateKey,
  txHash,
  timeoutMs = 120000,
}: {
  chainSlug: string
  privateKey: Hex
  txHash: Hex
  timeoutMs?: number
}): Promise<"success" | "error"> {
  try {
    const { kernelClient } = await buildKernelClient(chainSlug, privateKey)

    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error("Timeout waiting for user operation receipt")), timeoutMs)
    )

    const receipt = await Promise.race<any>([
      kernelClient.waitForUserOperationReceipt({ hash: txHash }),
      timeoutPromise,
    ])
    return receipt.receipt.status === "success" ? "success" : "error"
  } catch {
    return "error"
  }
}
