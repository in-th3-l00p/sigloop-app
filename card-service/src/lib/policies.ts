import { ApiError } from "./errors.js"
import { Card, CreateTransactionInput } from "../types.js"

function normalizeAddress(address: string) {
  return address.trim().toLowerCase()
}

export function enforceCardIsUsable(card: Card) {
  if (card.status !== "active") {
    throw new ApiError(403, "CARD_PAUSED", "Card is paused")
  }
}

export function enforceLimitsAndPolicies(card: Card, input: CreateTransactionInput) {
  const amount = BigInt(input.value)

  if (amount <= 0n) {
    throw new ApiError(400, "INVALID_AMOUNT", "Transaction amount must be greater than zero")
  }

  if (BigInt(card.balance) < amount) {
    throw new ApiError(402, "INSUFFICIENT_BALANCE", "Card balance is insufficient")
  }

  if (card.limit) {
    const nextSpent = BigInt(card.spent || "0") + amount
    if (nextSpent > BigInt(card.limit)) {
      throw new ApiError(402, "CARD_LIMIT_EXCEEDED", "Card spending limit exceeded")
    }
  }

  for (const policy of card.policies) {
    if (policy.type === "maxPerTx" && amount > BigInt(policy.value)) {
      throw new ApiError(403, "MAX_PER_TX_EXCEEDED", "Transaction exceeds max per transaction")
    }

    if (policy.type === "allowedRecipient") {
      if (normalizeAddress(input.to) !== normalizeAddress(policy.value)) {
        throw new ApiError(403, "RECIPIENT_NOT_ALLOWED", "Recipient is not allowed by card policy")
      }
    }

    if (policy.type === "allowedContract") {
      if (normalizeAddress(input.to) !== normalizeAddress(policy.value)) {
        throw new ApiError(403, "CONTRACT_NOT_ALLOWED", "Contract is not allowed by card policy")
      }
    }
  }
}
