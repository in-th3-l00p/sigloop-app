import { createPublicClient, http } from "viem"
import { generatePrivateKey, privateKeyToAccount } from "viem/accounts"
import { entryPoint07Address } from "viem/account-abstraction"
import { signerToEcdsaValidator } from "@zerodev/ecdsa-validator"
import { createKernelAccount } from "@zerodev/sdk"
import { getZeroDevChain, getZeroDevRpcUrl } from "./chains"

const KERNEL_V3_1 = "0.3.1"

const ENTRY_POINT = {
  address: entryPoint07Address,
  version: "0.7",
}

export async function createSmartAccount() {
  const privateKey = generatePrivateKey()
  const signer = privateKeyToAccount(privateKey)

  const publicClient = createPublicClient({
    chain: getZeroDevChain(),
    transport: http(getZeroDevRpcUrl()),
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
