/**
 * Reads a request body as text, giving up as soon as it exceeds maxBytes.
 * Returns null when the body is too large, so oversized uploads are never
 * buffered in full (a Content-Length header can be missing or wrong).
 */
export async function readBodyWithLimit(
  req: Request,
  maxBytes: number
): Promise<string | null> {
  if (!req.body) return "";
  const reader = req.body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    total += value.byteLength;
    if (total > maxBytes) {
      await reader.cancel();
      return null;
    }
    chunks.push(value);
  }
  const merged = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    merged.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return new TextDecoder().decode(merged);
}
