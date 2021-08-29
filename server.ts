import { serve, Response } from "deno/http/mod.ts";

import Controller from "./lib/controller.ts";
import {
  ensureAuthorized,
  deleteKey,
  UnauthorizedError,
} from "./lib/authorization.ts";
import bodyDecoder from "./lib/bodyDecoder.ts";
import { respond, match } from "./lib/routing.ts";

const server = serve({ port: 8888 });
const controller = new Controller("./participants/");
const favicon = Deno.readTextFileSync("./favicon.svg");

const participantRegex = /^\/participants\/([a-z0-9-]+)$/;
const routes = [
  match("GET", "/favicon.ico", () =>
    respond(200, favicon, new Headers({ "content-type": "image/svg+xml" }))
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
