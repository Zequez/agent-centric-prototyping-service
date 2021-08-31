import { newResponse, match, matchStatic } from "./lib/routing.ts";
import { generateStyles } from "./lib/generateStyles.ts";
import Controller from "./lib/controller.ts";
import { ensureAuthorized, deleteKey } from "./lib/authorization.ts";
import bodyDecoder from "./lib/bodyDecoder.ts";

const staticFile = (file: string) => Deno.readTextFileSync(`./static/${file}`);
const readStatic = (file: string) => () => staticFile(file);

export type RoutesContext = {
  isDev: boolean;
  controller: Controller;
};

const participantRegex = /^\/participants\/([a-z0-9-]+)$/;
export default ({ isDev, controller }: RoutesContext) => [
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
    newResponse(200, Object.fromEntries(controller.all()))
  ),
  match("GET", participantRegex, ([participant]) => {
    const data = controller.get(participant);
    return data ? newResponse(200, data) : newResponse(404);
  }),
  match("POST", participantRegex, async ([participant], req) => {
    ensureAuthorized(participant, req);

    const data = await bodyDecoder(req);
    if (data) {
      controller.set(participant, data);
      return newResponse(200, data);
    } else {
      return newResponse(400);
    }
  }),
  match("DELETE", participantRegex, ([participant], req) => {
    ensureAuthorized(participant, req);
    if (controller.get(participant)) {
      controller.delete(participant);
      deleteKey(participant);
      return newResponse(200);
    } else {
      return newResponse(404);
    }
  }),
];
