import { ApiError } from "./errors.js";
export function cardAuth(store) {
    return async (c, next) => {
        const secret = c.req.header("x-card-secret");
        if (!secret) {
            throw new ApiError(401, "MISSING_SECRET", "Missing x-card-secret header");
        }
        const runtime = await store.getRuntimeBySecret(secret);
        if (!runtime) {
            throw new ApiError(401, "INVALID_SECRET", "Invalid card secret");
        }
        c.set("runtime", runtime);
        c.set("cardSecret", secret);
        await next();
    };
}
