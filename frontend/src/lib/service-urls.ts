export const DEFAULT_CARD_SERVICE_BASE_URL = "https://card.sigloop.online"
export const DEFAULT_API_SERVICE_BASE_URL = "https://api.sigloop.online"

export const CARD_SERVICE_BASE_URL =
  (typeof window !== "undefined" && (window).__SIGLOOP_CONFIG__?.VITE_CARD_SERVICE_URL)
  || import.meta.env.VITE_CARD_SERVICE_URL
  || DEFAULT_CARD_SERVICE_BASE_URL

export const API_SERVICE_BASE_URL =
  (typeof window !== "undefined" && (window).__SIGLOOP_CONFIG__?.VITE_API_SERVICE_URL)
  || import.meta.env.VITE_API_SERVICE_URL
  || DEFAULT_API_SERVICE_BASE_URL
