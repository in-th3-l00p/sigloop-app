import { Context } from "hono"
import type { ContentfulStatusCode } from "hono/utils/http-status"

export class ApiError extends Error {
  status: number
  code: string

  constructor(status: number, code: string, message: string) {
    super(message)
    this.status = status
    this.code = code
  }
}

export function toErrorResponse(c: Context, error: unknown) {
  if (error instanceof ApiError) {
    return c.json(
      {
        error: {
          code: error.code,
          message: error.message,
        },
      },
      error.status as ContentfulStatusCode,
    )
  }

  const fallbackMessage = error instanceof Error ? error.message : "Unexpected server error"
  return c.json(
    {
      error: {
        code: "INTERNAL_ERROR",
        message: fallbackMessage,
      },
    },
    500,
  )
}
