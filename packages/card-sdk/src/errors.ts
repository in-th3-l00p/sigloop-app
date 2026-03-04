export class CardApiError extends Error {
  status: number
  code?: string
  details?: unknown

  constructor(message: string, status: number, code?: string, details?: unknown) {
    super(message)
    this.name = "CardApiError"
    this.status = status
    this.code = code
    this.details = details
  }
}

export class CardTimeoutError extends Error {
  constructor(message = "Request timed out") {
    super(message)
    this.name = "CardTimeoutError"
  }
}

export class CardNetworkError extends Error {
  constructor(message = "Network request failed") {
    super(message)
    this.name = "CardNetworkError"
  }
}
