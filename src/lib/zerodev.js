import { createPublicClient, http } from "viem"
import { generatePrivateKey, privateKeyToAccount } from "viem/accounts"
import { entryPoint07Address } from "viem/account-abstraction"
import { signerToEcdsaValidator } from "@zerodev/ecdsa-validator"
import { createKernelAccount, createKernelAccountClient } from "@zerodev/sdk"
import { getChainConfig } from "./chains"

const KERNEL_V3_1 = "0.3.1"

const ENTRY_POINT = {
  address: entryPoint07Address,
  version: "0.7",
}

export async function createSmartAccount(chainSlug) {
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

export async function sendTransaction({ chainSlug, privateKey, to, value }) {
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
