import { ServerRequest, Response } from "std/http/mod.ts";

const statusMessages: Record<number, string> = {
  200: "Success",
  404: "Not found",
  400: "Invalid request",
  401: "Unauthorized",
};

export function respond(
  status: number,
  body?: Record<string, unknown> | string,
  headers?: Headers
): Response {
  return {
    status: status,
    headers: headers
      ? headers
      : new Headers({
          "Content-Type": "application/json",
        }),
    body:
      typeof body === "string"
        ? body
        : JSON.stringify(
            body
              ? body
              : { status, message: statusMessages[status] || "Unknown" }
          ),
  };
}

export function match(
  method: string,
  matcher: string | RegExp,
  cb: (params: string[], req: ServerRequest) => Response | Promise<Response>
): (req: ServerRequest) => Promise<null | Response> {
  return async function (req: ServerRequest) {
    if (req.method === method) {
      if (typeof matcher === "string") {
        if (req.url === matcher) {
          return await cb([], req);
        }
      } else {
        const m = req.url.match(matcher);
        if (m) {
          return await cb(m.slice(1), req);
        }
      }
    }

    return null;
  };
}
