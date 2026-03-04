export function hashApiKey(value: string): string {
  let hash = 2166136261
  for (let i = 0; i < value.length; i += 1) {
    hash ^= value.charCodeAt(i)
    hash = Math.imul(hash, 16777619)
  }
  return `fnv1a_${(hash >>> 0).toString(16)}`
}

function randomPart() {
  return Math.random().toString(36).slice(2, 10)
}

export function createApiKeyToken(): { token: string; prefix: string; hash: string } {
  const body = `${randomPart()}${randomPart()}${Date.now().toString(36)}`
  const token = `sgapi_${body}`
  return {
    token,
    prefix: token.slice(0, 12),
    hash: hashApiKey(token),
  }
}
