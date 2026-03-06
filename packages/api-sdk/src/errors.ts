export class ApiApiError extends Error {
  status: number
  code?: string
  details?: unknown

  constructor(message: string, status: number, code?: string, details?: unknown) {
    super(message)
    this.name = "ApiApiError"
    this.status = status
    this.code = code
    this.details = details
  }
}

export class ApiTimeoutError extends Error {
  constructor(message = "Request timed out") {
    super(message)
    this.name = "ApiTimeoutError"
  }
}

export class ApiNetworkError extends Error {
  constructor(message = "Network request failed") {
    super(message)
    this.name = "ApiNetworkError"
  }
}
