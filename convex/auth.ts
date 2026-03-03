import { query } from "./_generated/server"

export const viewer = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity()
    if (identity === null) {
      console.log("[auth.viewer] no identity — user is not authenticated")
      return null
    }
    console.log("[auth.viewer] identity resolved")
    console.log(`[auth.viewer]   subject: ${identity.subject}`)
    console.log(`[auth.viewer]   issuer: ${identity.issuer}`)
    console.log(`[auth.viewer]   tokenIdentifier: ${identity.tokenIdentifier}`)
    return {
      subject: identity.subject,
      issuer: identity.issuer,
      tokenIdentifier: identity.tokenIdentifier,
    }
  },
})
