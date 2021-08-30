const textDecoder = new TextDecoder();

export default async function bodyDecoder(
  req: Request
): Promise<null | Record<string, unknown>> {
  const readResult = await req.body?.getReader().read();
  const body = readResult ? textDecoder.decode(readResult.value) : null;
  if (!body) return null;
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
