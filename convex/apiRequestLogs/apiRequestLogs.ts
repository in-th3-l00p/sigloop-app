import { query } from "../_generated/server"
import { v } from "convex/values"
import { requireAuth } from "../lib/auth"

function formatDay(timestamp: number): string {
  const date = new Date(timestamp)
  const year = date.getUTCFullYear()
  const month = `${date.getUTCMonth() + 1}`.padStart(2, "0")
  const day = `${date.getUTCDate()}`.padStart(2, "0")
  return `${year}-${month}-${day}`
}

export const list = query({
  args: {
    limit: v.optional(v.number()),
    cursor: v.optional(v.number()),
    method: v.optional(v.string()),
    statusMin: v.optional(v.number()),
    statusMax: v.optional(v.number()),
    pathContains: v.optional(v.string()),
    fromTs: v.optional(v.number()),
    toTs: v.optional(v.number()),
    apiKeyId: v.optional(v.id("apiKeys")),
  },
  handler: async (ctx, args) => {
    const userId = await requireAuth(ctx, "apiRequestLogs.list")
    const rows = await ctx.db
      .query("apiRequestLogs")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect()

    const method = args.method?.toUpperCase()
    const pathContains = args.pathContains?.toLowerCase().trim()

    const filtered = rows
      .filter((item) => {
        if (method && item.method.toUpperCase() !== method) return false
        if (args.statusMin !== undefined && item.statusCode < args.statusMin) return false
        if (args.statusMax !== undefined && item.statusCode > args.statusMax) return false
        if (pathContains && !item.path.toLowerCase().includes(pathContains)) return false
        if (args.fromTs !== undefined && item.createdAt < args.fromTs) return false
        if (args.toTs !== undefined && item.createdAt > args.toTs) return false
        if (args.apiKeyId !== undefined && item.apiKeyId !== args.apiKeyId) return false
        return true
      })
      .sort((a, b) => b.createdAt - a.createdAt)

    const limit = Math.min(Math.max(args.limit ?? 50, 1), 200)
    const cursor = Math.max(args.cursor ?? 0, 0)
    const items = filtered.slice(cursor, cursor + limit)
    const nextCursor = cursor + limit < filtered.length ? cursor + limit : null

    return {
      items,
      nextCursor,
      total: filtered.length,
    }
  },
})

export const usage = query({
  args: {
    days: v.optional(v.number()),
    apiKeyId: v.optional(v.id("apiKeys")),
  },
  handler: async (ctx, args) => {
    const userId = await requireAuth(ctx, "apiRequestLogs.usage")
    const days = args.days ?? 7
    const since = Date.now() - days * 24 * 60 * 60 * 1000

    const rows = await ctx.db
      .query("apiRequestLogs")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect()

    const filtered = rows.filter((item) => {
      if (item.createdAt < since) return false
      if (args.apiKeyId && item.apiKeyId !== args.apiKeyId) return false
      return true
    })

    const byDay = new Map<string, { total: number; success: number; error: number }>()
    for (const row of filtered) {
      const key = formatDay(row.createdAt)
      const current = byDay.get(key) ?? { total: 0, success: 0, error: 0 }
      current.total += 1
      if (row.statusCode >= 200 && row.statusCode < 400) current.success += 1
      if (row.statusCode >= 400) current.error += 1
      byDay.set(key, current)
    }

    return {
      total: filtered.length,
      success: filtered.filter((item) => item.statusCode >= 200 && item.statusCode < 400).length,
      error: filtered.filter((item) => item.statusCode >= 400).length,
      perDay: Array.from(byDay.entries())
        .sort((a, b) => a[0].localeCompare(b[0]))
        .map(([day, value]) => ({ day, ...value })),
    }
  },
})
