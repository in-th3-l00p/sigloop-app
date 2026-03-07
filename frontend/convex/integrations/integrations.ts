import { mutation, query } from "../_generated/server"
import { v } from "convex/values"
import { requireAuth } from "../lib/auth"

const configValidator = v.optional(v.object({
  secretRef: v.optional(v.string()),
  language: v.optional(v.string()),
  skillProduct: v.optional(v.string()),
  packageManager: v.optional(v.string()),
  endpointBaseUrl: v.optional(v.string()),
  toolLibrary: v.optional(v.string()),
  agentPurpose: v.optional(v.string()),
  taskScope: v.optional(v.string()),
  behavioralRules: v.optional(v.string()),
  escalationPolicy: v.optional(v.string()),
}))

export const createFromPreset = mutation({
  args: {
    cardId: v.id("agentCards"),
    presetId: v.string(),
    type: v.string(),
    platform: v.string(),
    name: v.string(),
    description: v.string(),
    schemaVersion: v.float64(),
    config: configValidator,
  },
  handler: async (ctx, args) => {
    const userId = await requireAuth(ctx, "integrations.createFromPreset")
    const card = await ctx.db.get(args.cardId)
    if (!card || card.userId !== userId) {
      throw new Error("Card not found")
    }

    return ctx.db.insert("integrations", {
      userId,
      cardId: args.cardId,
      presetId: args.presetId,
      type: args.type,
      platform: args.platform,
      name: args.name,
      description: args.description,
      status: "not_started",
      schemaVersion: args.schemaVersion,
      config: args.config,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    })
  },
})

export const listByCard = query({
  args: { cardId: v.id("agentCards") },
  handler: async (ctx, args) => {
    const userId = await requireAuth(ctx, "integrations.listByCard")
    const card = await ctx.db.get(args.cardId)
    if (!card || card.userId !== userId) {
      throw new Error("Card not found")
    }

    const integrations = await ctx.db
      .query("integrations")
      .withIndex("by_card", (q) => q.eq("cardId", args.cardId))
      .collect()

    return integrations.sort((a, b) => b.createdAt - a.createdAt)
  },
})

export const recordSetupInteraction = mutation({
  args: { id: v.id("integrations") },
  handler: async (ctx, args) => {
    const userId = await requireAuth(ctx, "integrations.recordSetupInteraction")
    const integration = await ctx.db.get(args.id)
    if (!integration || integration.userId !== userId) {
      throw new Error("Integration not found")
    }

    const nextStatus = integration.status === "verified" ? "verified" : "configured"
    await ctx.db.patch(args.id, {
      status: nextStatus,
      updatedAt: Date.now(),
    })

    return { ...integration, status: nextStatus }
  },
})

export const setVerificationResult = mutation({
  args: {
    id: v.id("integrations"),
    success: v.boolean(),
    message: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await requireAuth(ctx, "integrations.setVerificationResult")
    const integration = await ctx.db.get(args.id)
    if (!integration || integration.userId !== userId) {
      throw new Error("Integration not found")
    }

    const status = args.success ? "verified" : "error"
    await ctx.db.patch(args.id, {
      status,
      verificationMessage: args.message,
      verifiedAt: args.success ? Date.now() : undefined,
      updatedAt: Date.now(),
    })

    return { ...integration, status }
  },
})

export const remove = mutation({
  args: { id: v.id("integrations") },
  handler: async (ctx, args) => {
    const userId = await requireAuth(ctx, "integrations.remove")
    const integration = await ctx.db.get(args.id)
    if (!integration || integration.userId !== userId) {
      throw new Error("Integration not found")
    }
    await ctx.db.delete(args.id)
  },
})

export const updateConfig = mutation({
  args: {
    id: v.id("integrations"),
    config: configValidator,
  },
  handler: async (ctx, args) => {
    const userId = await requireAuth(ctx, "integrations.updateConfig")
    const integration = await ctx.db.get(args.id)
    if (!integration || integration.userId !== userId) {
      throw new Error("Integration not found")
    }

    const mergedConfig = {
      ...(integration.config ?? {}),
      ...(args.config ?? {}),
    }

    await ctx.db.patch(args.id, {
      config: mergedConfig,
      status: integration.status === "verified" ? "verified" : "configured",
      updatedAt: Date.now(),
    })

    return { ...integration, config: mergedConfig }
  },
})
