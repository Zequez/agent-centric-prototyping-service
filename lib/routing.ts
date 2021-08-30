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

type MatchCallback = (
  params: string[],
  req: ServerRequest
) => Response | Promise<Response>;

export function match(
  method: string,
  matcher: string | RegExp,
  cb: MatchCallback
): (req: ServerRequest) => Promise<null | Response> {
  console.log(`ROUTE ${method} ${matcher}`);
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

export function matchStatic(
  filePath: string,
  readFun: () => string | Promise<string>,
  contentType: string,
  cache: boolean
): (req: ServerRequest) => Promise<null | Response> {
  return match(
    "GET",
    filePath,
    cacheIf(cache, async () =>
      respond(
        200,
        await readFun(),
        new Headers({ "content-type": contentType })
      )
    )
  );
}

export function cacheIf(condition: boolean, cb: MatchCallback): MatchCallback {
  if (!condition) return cb;
  let cache: Response | null = null;
  return async (params: string[], req: ServerRequest) => {
    if (!cache) cache = await cb(params, req);
    else console.log("SERVING CACHED");
    return cache;
  };
}
