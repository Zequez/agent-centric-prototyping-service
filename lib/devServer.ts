import {
  WebSocketClient,
  WebSocketServer,
} from "https://deno.land/x/websocket@v0.1.1/mod.ts";

const DEBOUNCE_TIME = 100;
let timeout = 0;
function debouncedCall(fn: () => void) {
  clearTimeout(timeout);
  timeout = setTimeout(fn, DEBOUNCE_TIME);
}

export default async () => {
  const wss = new WebSocketServer(8080);

  wss.on("connection", function (ws: WebSocketClient) {
    console.log("[Web socket] Client connected");
    ws.on("close", () => {
      console.log("[Web socket] Client disconnected");
    });
  });

  const watcher = Deno.watchFs(["./static"]);
  for await (const event of watcher) {
    debouncedCall(() => {
      console.log(event);
      wss.clients.forEach((ws) => {
        if (!ws.isClosed) {
          ws.send("change");
        }
      });
    });
  }
};
