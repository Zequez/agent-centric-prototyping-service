import { urlParse } from "https://deno.land/x/url_parse/mod.ts";

const statusMessages: Record<number, string> = {
  200: "Success",
  404: "Not found",
  400: "Invalid request",
  401: "Unauthorized",
};

const defaultHeaders = new Headers({
  "Content-Type": "application/json",
});

export function respond(
  status: number,
  body?: Record<string, unknown> | string,
  headers?: Headers
): Response {
  return new Response(
    typeof body === "string"
      ? body
      : JSON.stringify(
          body ? body : { status, message: statusMessages[status] || "Unknown" }
        ),
    { status, headers: headers || defaultHeaders }
  );
}

type MatchCallback = (
  params: string[],
  req: Request
) => Response | Promise<Response>;

export function match(
  method: string,
  matcher: string | RegExp,
  cb: MatchCallback
): (req: Request) => Promise<null | Response> {
  console.log(`ROUTE ${method} ${matcher}`);
  return async function (req: Request) {
    const url = urlParse(req.url);

    if (req.method === method) {
      if (typeof matcher === "string") {
        if (url.pathname === matcher) {
          return await cb([], req);
        }
      } else {
        const m = url.pathname.match(matcher);
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
): (req: Request) => Promise<null | Response> {
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
  return async (params: string[], req: Request) => {
    if (!cache) cache = await cb(params, req);
    else console.log("SERVING CACHED");
    return cache;
  };
}
