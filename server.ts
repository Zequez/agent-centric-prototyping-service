import { serve, ServerRequest } from "deno/http/mod.ts";
import * as path from "deno/path/mod.ts";
import { readAll } from "deno/io/mod.ts";
import { existsSync } from "deno/fs/mod.ts";
import { createHash } from "deno/hash/mod.ts";
import favicon from "./favicon.ts";
import Controller from "./controller.ts";

const server = serve({ port: 8888 });
const controller = new Controller("./participants/");
const textDecoder = new TextDecoder();

const statusMessages: Record<number, string> = {
  200: "Success",
  404: "Not found",
  400: "Invalid request",
  401: "Unauthorized",
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
      // GET PARTICIPANTS
      const participants = Object.fromEntries(controller.all());
      await respond(200, participants);
    } else {
      // GET PARTICIPANT
      const participant = req.url.slice(1);
      const data = controller.get(participant);
      if (data) {
        await respond(200, data);
      } else {
        await respond(404);
      }
    }
  }

  // SET participant
  if (req.method === "POST") {
    const participant = extractParticipant(req);
    if (participant) {
      if (verifyAuthorization(participant, req)) {
        const data = await extractBodyData(req);
        if (data) {
          controller.set(participant, data);
          await respond(200, data);
        } else {
          await respond(400);
        }
      } else {
        await respond(401);
      }
    } else {
      await respond(400);
    }
  }

  // DELETE participant
  if (req.method === "DELETE") {
    const participant = extractParticipant(req);
    if (participant) {
      if (verifyAuthorization(participant, req)) {
        if (controller.get(participant)) {
          controller.delete(participant);
          deleteAuthorization(participant);
          await respond(200);
        } else {
          await respond(404);
        }
      } else {
        await respond(401);
      }
    } else {
      await respond(400);
    }
  }
}

// const routes = {
//   getParticipants: () => {},
//   getParticipant: () => {},
//   postParticipant: () => {},
//   deleteParticipant: () => {},
// };

function deleteAuthorization(participant: string) {
  const keyFilePath = path.join("keys", participant);
  try {
    Deno.removeSync(keyFilePath);
    return true;
  } catch {
    return false;
  }
}

function verifyAuthorization(participant: string, req: ServerRequest): boolean {
  const keyFilePath = path.join("keys", participant);
  const isSecuredByKey = existsSync(keyFilePath);
  const authorizationHash = extractHashedAuthorization(req);

  if (isSecuredByKey) {
    const storedHash = Deno.readTextFileSync(keyFilePath);
    if (authorizationHash) {
      return storedHash === authorizationHash;
    } else {
      return false;
    }
  } else if (authorizationHash) {
    Deno.writeTextFileSync(keyFilePath, authorizationHash);
  }

  return true;
}

function extractHashedAuthorization(req: ServerRequest): string | null {
  const auth = req.headers.get("Authorization");
  if (auth) {
    const m = auth.match("Basic (.*)");
    if (m) {
      const hash = createHash("sha3-512");
      hash.update(atob(m[1]));
      return hash.toString();
    }
  }

  return null;
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
