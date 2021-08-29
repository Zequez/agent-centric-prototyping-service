import { serve, Response } from "std/http/mod.ts";

import Controller from "./lib/controller.ts";
import {
  ensureAuthorized,
  deleteKey,
  UnauthorizedError,
} from "./lib/authorization.ts";
import bodyDecoder from "./lib/bodyDecoder.ts";
import { respond, match } from "./lib/routing.ts";
import { generateStyles } from "./lib/generateStyles.ts";
import runDevServer from "./devServer.ts";

runDevServer();
const server = serve({ port: 8888 });
const controller = new Controller("./participants/");
// TODO: On dev mode reload, on prod keep on memory
const staticFile = (file: string) => Deno.readTextFileSync(`./static/${file}`);
const favicon = staticFile("favicon.svg");

const participantRegex = /^\/participants\/([a-z0-9-]+)$/;
const routes = [
  match("GET", "/favicon.ico", () =>
    respond(200, favicon, new Headers({ "content-type": "image/svg+xml" }))
  ),
  match("GET", "/", () =>
    respond(
      200,
      staticFile("index.html"),
      new Headers({ "content-type": "text/html" })
    )
  ),
  match("GET", "/styles.css", () =>
    respond(
      200,
      generateStyles(staticFile("index.html")),
      new Headers({ "content-type": "text/css" })
    )
  ),
  match("GET", "/main.js", async () => {
    const { files } = await Deno.emit("./static/main.tsx", {
      check: false,
      bundle: "module",
    });
    console.log(files);
    const key = Object.keys(files).find((k) => k.endsWith("bundle.js")) || "";
    return respond(
      200,
      files[key] as string,
      new Headers({ "content-type": "text/javascript" })
    );
  }),
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

for await (const req of server) {
  const start = Date.now();
  console.log(req.method, req.url);

  let response: null | Response = null;
  try {
    for (const route of routes) {
      response = await route(req);
      if (response) {
        await req.respond(response);
        break;
      }
    }
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      await req.respond(respond(401));
    } else {
      console.log(error);
    }
  }

  if (!response) await req.respond(respond(404));
  const ms = Date.now() - start;
  console.log(`Response time ${ms}ms`);
}
