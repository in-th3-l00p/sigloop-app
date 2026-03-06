import { mutation, query } from "../_generated/server"
import { v } from "convex/values"
import { requireAuth } from "../lib/auth"

export const create = mutation({
  args: {
    name: v.string(),
    address: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await requireAuth(ctx, "contacts.create")
    return ctx.db.insert("contacts", {
      userId,
      name: args.name,
      address: args.address,
    })
  },
})

export const list = query({
  args: {},
  handler: async (ctx) => {
    const userId = await requireAuth(ctx, "contacts.list")
    const contacts = await ctx.db
      .query("contacts")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect()

    return contacts.sort((a, b) => a.name.localeCompare(b.name))
  },
})

export const remove = mutation({
  args: { id: v.id("contacts") },
  handler: async (ctx, args) => {
    const userId = await requireAuth(ctx, "contacts.remove")
    const contact = await ctx.db.get(args.id)
    if (!contact || contact.userId !== userId) {
      throw new Error("Contact not found")
    }
    await ctx.db.delete(args.id)
  },
})
