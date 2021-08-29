import { ServerRequest } from "std/http/mod.ts";
import * as path from "std/path/mod.ts";
import { existsSync } from "std/fs/mod.ts";
import { createHash } from "std/hash/mod.ts";

const KEYS_PATH = "keys";

export function deleteKey(participant: string) {
  const keyFilePath = path.join(KEYS_PATH, participant);
  try {
    Deno.removeSync(keyFilePath);
    return true;
  } catch {
    return false;
  }
}

export class UnauthorizedError extends Error {}

export function ensureAuthorized(
  participant: string,
  req: ServerRequest
): void {
  if (!verifyAuthorization(participant, req)) {
    throw new UnauthorizedError();
  }
}

function verifyAuthorization(participant: string, req: ServerRequest): boolean {
  const keyFilePath = path.join(KEYS_PATH, participant);
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
