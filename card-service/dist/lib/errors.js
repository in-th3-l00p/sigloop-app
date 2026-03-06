export class ApiError extends Error {
    status;
    code;
    constructor(status, code, message) {
        super(message);
        this.status = status;
        this.code = code;
    }
}
export function toErrorResponse(c, error) {
    if (error instanceof ApiError) {
        return c.json({
            error: {
                code: error.code,
                message: error.message,
            },
        }, error.status);
    }
    return c.json({
        error: {
            code: "INTERNAL_ERROR",
            message: "Unexpected server error",
        },
    }, 500);
}
