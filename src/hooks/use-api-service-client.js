import { useEffect, useMemo, useState } from "react"
import { createApiClient } from "@sigloop/api"

const STORAGE_BASE_URL = "sigloop.apiService.baseUrl"
const STORAGE_API_KEY = "sigloop.apiService.apiKey"

function readStorage(key, fallback = "") {
  if (typeof window === "undefined") return fallback
  const value = window.localStorage.getItem(key)
  return value ?? fallback
}

export function useApiServiceClient() {
  const [baseUrl, setBaseUrl] = useState(() => readStorage(STORAGE_BASE_URL, import.meta.env.VITE_SIGLOOP_API_BASE_URL ?? "http://localhost:8788"))
  const [apiKey, setApiKey] = useState(() => readStorage(STORAGE_API_KEY, import.meta.env.VITE_SIGLOOP_API_KEY ?? ""))

  useEffect(() => {
    if (typeof window === "undefined") return
    window.localStorage.setItem(STORAGE_BASE_URL, baseUrl)
  }, [baseUrl])

  useEffect(() => {
    if (typeof window === "undefined") return
    window.localStorage.setItem(STORAGE_API_KEY, apiKey)
  }, [apiKey])

  const client = useMemo(
    () => createApiClient({ baseUrl, apiKey: apiKey || undefined }),
    [baseUrl, apiKey],
  )

  return {
    client,
    baseUrl,
    setBaseUrl,
    apiKey,
    setApiKey,
    isConfigured: Boolean(baseUrl.trim() && apiKey.trim()),
  }
}
