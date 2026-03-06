import type { QueryCtx, MutationCtx } from "../_generated/server"

export async function requireAuth(
  ctx: QueryCtx | MutationCtx,
  caller: string
): Promise<string> {
  console.log(`[auth] requireAuth called from: ${caller}`)

  const identity = await ctx.auth.getUserIdentity()

  if (!identity) {
    console.error(`[auth] FAILED — no identity returned from ctx.auth.getUserIdentity()`)
    console.error(`[auth]   caller: ${caller}`)
    console.error(`[auth]   this usually means the JWT token is missing, expired, or malformed`)
    throw new Error("Not authenticated")
  }

  console.log(`[auth] OK — identity resolved`)
  console.log(`[auth]   tokenIdentifier: ${identity.tokenIdentifier}`)
  console.log(`[auth]   subject: ${identity.subject}`)
  console.log(`[auth]   issuer: ${identity.issuer}`)

  if (identity.tokenIdentifier === undefined || identity.tokenIdentifier === "") {
    console.error(`[auth] FAILED — identity exists but tokenIdentifier is empty`)
    console.error(`[auth]   full identity: ${JSON.stringify(identity)}`)
    throw new Error("Invalid identity: missing tokenIdentifier")
  }

  return identity.tokenIdentifier
}
