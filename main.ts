import Controller from "./lib/controller.ts";
import {
  ensureAuthorized,
  deleteKey,
  UnauthorizedError,
} from "./lib/authorization.ts";
import bodyDecoder from "./lib/bodyDecoder.ts";
import { respond, match, matchStatic } from "./lib/routing.ts";
import { generateStyles } from "./lib/generateStyles.ts";
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
  `[${new Date().toISOString()}] Server started at 0.0.0.0:${
    HTTPS ? HTTPS_PORT : PORT
  } on ${APP_ENV.toUpperCase()} mode`
);

console.log("Using YML data controller");
const controller = new Controller("./participants/");

const staticFile = (file: string) => Deno.readTextFileSync(`./static/${file}`);
const readStatic = (file: string) => () => staticFile(file);

const participantRegex = /^\/participants\/([a-z0-9-]+)$/;
const routes = [
  matchStatic("/", readStatic("index.html"), "text/html", !isDev),
  matchStatic(
    "/favicon.ico",
    readStatic("favicon.svg"),
    "image/svg+xml",
    !isDev
  ),
  matchStatic("/robots.txt", readStatic("robots.txt"), "text/plain", !isDev),
  matchStatic(
    "/styles.css",
    () => generateStyles(staticFile("index.html") + staticFile("app.tsx")),
    "text/css",
    !isDev
  ),
  matchStatic(
    "/main.js",
    async () => {
      const { files } = await Deno.emit("./static/main.tsx", {
        check: false,
        bundle: "module",
      });
      const key = Object.keys(files).find((k) => k.endsWith("bundle.js")) || "";
      return files[key] as string;
    },
    "text/javascript",
    !isDev
  ),

  match("GET", "/participants", () =>
    respond(200, Object.fromEntries(controller.all()))
  ),
  match("GET", participantRegex, ([participant]) => {
    const data = controller.get(participant);
    return data ? respond(200, data) : respond(404);
  }),
  match("POST", participantRegex, async ([participant], req) => {
    ensureAuthorized(participant, req);

    const data = await bodyDecoder(req);
    if (data) {
      controller.set(participant, data);
      return respond(200, data);
    } else {
      return respond(400);
    }
  }),
  match("DELETE", participantRegex, ([participant], req) => {
    ensureAuthorized(participant, req);
    if (controller.get(participant)) {
      controller.delete(participant);
      deleteKey(participant);
      return respond(200);
    } else {
      return respond(404);
    }
  }),
];

for await (const conn of server) {
  serveHttp(conn);
}

async function serveHttp(conn: Deno.Conn) {
  const httpConn = Deno.serveHttp(conn);

  for await (const reqEvent of httpConn) {
    const req = reqEvent.request;
    const start = Date.now();
    console.log(req.method, req.url);

    let response: null | Response = null;
    try {
      for (const route of routes) {
        response = await route(req);
        if (response) {
          await reqEvent.respondWith(response);
          break;
        }
      }
    } catch (error) {
      if (error instanceof UnauthorizedError) {
        await reqEvent.respondWith(respond(401));
      } else {
        console.log(error);
      }
    }

    if (!response) await reqEvent.respondWith(respond(404));
    const ms = Date.now() - start;
    console.log(`Response time ${ms}ms`);
  }
}
