export async function limitedBody(request: Request, limit = 1_000_000): Promise<Uint8Array> {
  if (Number(request.headers.get('content-length') || 0) > limit) throw new Error('Input melebihi batas ukuran.');
  const reader = request.body?.getReader();
  if (!reader) return new Uint8Array();
  const parts: Uint8Array[] = []; let length = 0;
  while (true) { const {done,value} = await reader.read(); if (done) break; length += value.byteLength; if (length > limit) { await reader.cancel(); throw new Error('Input melebihi batas ukuran.'); } parts.push(value); }
  return Buffer.concat(parts);
}
export async function jsonBody(request: Request): Promise<unknown> {
  if (!request.headers.get('content-type')?.startsWith('application/json')) throw new Error('Content-Type application/json wajib.');
  return JSON.parse(Buffer.from(await limitedBody(request)).toString('utf8'));
}
