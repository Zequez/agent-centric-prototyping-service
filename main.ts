import Controller from "./lib/controller.ts";
import { UnauthorizedError } from "./lib/authorization.ts";
import { respond } from "./lib/routing.ts";
import generateRoutes from "./routes.ts";

import runDevServer from "./lib/devServer.ts";

const HTTPS_CERT = Deno.env.get("HTTPS_CERT");
const HTTPS_CERT_KEY = Deno.env.get("HTTPS_CERT_KEY");
const HTTPS_PORT = 443;
const APP_ENV = Deno.env.get("APP_ENV");
const PORT = parseInt(Deno.env.get("PORT") || "", 10);
if (!PORT) throw new Error("PORT environment variable not found");
if (!APP_ENV) throw new Error("APP_ENV environment variable not found");

const isDev = APP_ENV === "development";

Deno.writeTextFileSync(
  "./cache/env.ts",
  `export default ${JSON.stringify({ APP_ENV })};`
);

if (isDev) runDevServer();

const HTTPS = !!(HTTPS_CERT && HTTPS_CERT_KEY);
const server =
  HTTPS_CERT && HTTPS_CERT_KEY
    ? Deno.listenTls({
        port: HTTPS_PORT,
        certFile: HTTPS_CERT,
        keyFile: HTTPS_CERT_KEY,
      })
    : Deno.listen({ port: PORT });

console.log(
  `[${new Date().toISOString()}] ${
    HTTPS ? "HTTPS" : "HTTP"
  } Server started at 0.0.0.0:${
    HTTPS ? HTTPS_PORT : PORT
  } on ${APP_ENV.toUpperCase()} mode `
);

console.log("Using YML data controller");
const controller = new Controller("./participants/");

const routes = generateRoutes({ isDev, controller });

// Redirect all port 80 traffic to HTTPS
if (HTTPS) {
  (async () => {
    console.log("Listening on port 80 to redirect to HTTPS");
    for await (const conn of Deno.listen({ port: 80 })) {
      const httpConn = Deno.serveHttp(conn);
      for await (const reqEvent of httpConn) {
        const redirectAddress = reqEvent.request.url.replace("http", "https");
        reqEvent.respondWith(
          new Response("", {
            status: 301,
            headers: new Headers({ Location: redirectAddress }),
          })
        );
      }
    }
  })();
}

for await (const conn of server) {
  serveHttp(conn);
}

async function serveHttp(conn: Deno.Conn) {
  const httpConn = Deno.serveHttp(conn);

  while (true) {
    let reqEvent = null;
    try {
      reqEvent = await httpConn.nextRequest();
      if (reqEvent === null) {
        return;
      }

      const req = reqEvent.request;
      const start = Date.now();
      console.log(req.method, req.url);

      let response: null | Response = null;

      for (const route of routes) {
        response = await route(req);
        if (response) {
          await reqEvent.respondWith(response);
          break;
        }
      }

      if (!response) await reqEvent.respondWith(respond(404));
      const ms = Date.now() - start;
      console.log(`Response time ${ms}ms`);
    } catch (error) {
      if (error instanceof UnauthorizedError && reqEvent) {
        await reqEvent.respondWith(respond(401));
      } else {
        console.log(error);
      }
    }
  }
}
