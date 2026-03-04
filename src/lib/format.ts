export function truncateAddress(addr: string | undefined | null, start = 6, end = 4) {
  if (!addr) return ""
  return `${addr.slice(0, start)}...${addr.slice(-end)}`
}

export function formatDate(timestamp: number) {
  const date = new Date(timestamp)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffSecs = Math.floor(diffMs / 1000)
  const diffMins = Math.floor(diffSecs / 60)
  const diffHours = Math.floor(diffMins / 60)
  const diffDays = Math.floor(diffHours / 24)

  if (diffSecs < 60) return "just now"
  if (diffMins < 60) return `${diffMins}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  if (diffDays < 7) return `${diffDays}d ago`

  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: date.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
  })
}

export function formatEth(weiBigInt: bigint | string | number | undefined | null) {
  if (weiBigInt === undefined || weiBigInt === null) return "0"
  const wei = BigInt(weiBigInt)
  const whole = wei / BigInt(1e18)
  const remainder = wei % BigInt(1e18)
  const decimals = remainder.toString().padStart(18, "0").slice(0, 6).replace(/0+$/, "")
  return decimals ? `${whole}.${decimals}` : whole.toString()
}

export function formatEthFull(weiBigInt: bigint | string | number | undefined | null) {
  if (weiBigInt === undefined || weiBigInt === null) return "0.0"
  const wei = BigInt(weiBigInt)
  const whole = wei / 1000000000000000000n
  const remainder = wei % 1000000000000000000n
  const decimals = remainder.toString().padStart(18, "0").replace(/0+$/, "")
  if (!decimals) {
    return `${whole}.0`
  }
  return `${whole}.${decimals}`
}

export function isValidAddress(addr: unknown): addr is `0x${string}` {
  return typeof addr === "string" && /^0x[0-9a-fA-F]{40}$/.test(addr)
}
