function getGlobalConfig() {
  if (typeof window === "undefined") return {}
  return window.__SIGLOOP_CONFIG__ ?? {}
}

export function getConfigValue(key, fallback) {
  const value = getGlobalConfig()[key]
  if (typeof value === "string" && value.length > 0) return value
  return fallback
}

export function getRequiredAbsoluteUrl(key, fallback) {
  const value = getConfigValue(key, fallback)
  if (typeof value !== "string" || !/^https?:\/\//i.test(value)) {
    throw new Error(
      `Invalid ${key}. Expected an absolute URL (e.g. https://...); got: ${String(value)}`,
    )
  }
  return value
}

