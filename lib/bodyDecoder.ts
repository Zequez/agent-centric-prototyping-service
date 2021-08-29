import { ServerRequest } from "std/http/mod.ts";
import { readAll } from "std/io/mod.ts";
const textDecoder = new TextDecoder();

export default async function bodyDecoder(
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
