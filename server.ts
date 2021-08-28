import { serve, ServerRequest } from "deno/http/mod.ts";
import { readAll } from "deno/io/mod.ts";
import favicon from "./favicon.ts";
import Controller from "./controller.ts";

const server = serve({ port: 8888 });
const controller = new Controller("./participants/");
const textDecoder = new TextDecoder();

const statusMessages: Record<number, string> = {
  200: "Success",
  404: "Not found",
  400: "Invalid request",
};

const respondWith =
  (req: ServerRequest) => (status: number, data?: Record<string, unknown>) => {
    req.respond({
      status: status,
      headers: new Headers({
        "Content-Type": "application/json",
      }),
      body: JSON.stringify(
        data ? data : { status, message: statusMessages[status] || "Unknown" }
      ),
    });
  };

for await (const req of server) {
  console.log(req.method, req.url);
  const respond = respondWith(req);

  if (req.method === "GET") {
    if (req.url === "/favicon.ico") {
      await req.respond(favicon);
    } else if (req.url === "/") {
      const participants = Object.fromEntries(controller.all());
      await respond(200, participants);
    } else {
      const participant = req.url.slice(1);
      const data = controller.get(participant);
      if (data) {
        await respond(200, data);
      } else {
        await respond(404);
      }
    }
  }

  if (req.method === "POST") {
    const participant = extractParticipant(req);
    if (participant) {
      const data = await extractBodyData(req);
      if (data) {
        controller.set(participant, data);
        await respond(200, data);
      } else {
        await respond(400);
      }
    } else {
      await respond(400);
    }
  }

  if (req.method === "DELETE") {
    const participant = extractParticipant(req);
    if (participant) {
      if (controller.get(participant)) {
        controller.delete(participant);
        await respond(200);
      } else {
        await respond(404);
      }
    } else {
      await respond(400);
    }
  }
}

function extractParticipant(req: ServerRequest): string | null {
  const participant = req.url.slice(1);
  if (/^[a-z0-9-]+$/.test(participant)) {
    return participant;
  } else {
    return null;
  }
}

async function extractBodyData(
  req: ServerRequest
): Promise<null | Record<string, unknown>> {
  const body = textDecoder.decode(await readAll(req.body));
  try {
    const data = JSON.parse(body);
    if (typeof data === "object") {
      return data as Record<string, unknown>;
    } else {
      return null;
    }
  } catch {
    return null;
  }
}
