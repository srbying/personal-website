const EMPTY_ORIGINS = new Set();

export function jsonResponse(body, status, { origin, allowedOrigins = EMPTY_ORIGINS } = {}) {
  const headers = new Headers({
    "content-type": "application/json; charset=utf-8",
    "cache-control": "no-store",
    "x-content-type-options": "nosniff",
    "vary": "Origin"
  });
  if (origin && allowedOrigins.has(origin)) {
    headers.set("access-control-allow-origin", origin);
    headers.set("access-control-allow-methods", "GET, POST, OPTIONS");
    headers.set("access-control-allow-headers", "Content-Type");
    headers.set("access-control-max-age", "86400");
  }
  return new Response(status === 204 ? null : JSON.stringify(body), { status, headers });
}

export async function readBoundedJson(request, maxBodyBytes) {
  const declaredLength = Number(request.headers.get("content-length") ?? 0);
  if (Number.isFinite(declaredLength) && declaredLength > maxBodyBytes) {
    return { error: "request_too_large", status: 413 };
  }
  if (!/^application\/json(?:\s*;|$)/i.test(request.headers.get("content-type") ?? "")) {
    return { error: "unsupported_media_type", status: 415 };
  }
  if (!request.body) return { error: "invalid_request", status: 400 };

  const reader = request.body.getReader();
  const chunks = [];
  let byteLength = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      byteLength += value.byteLength;
      if (byteLength > maxBodyBytes) {
        try {
          await reader.cancel();
        } catch {
          // The request is already rejected; cancellation failure adds no value.
        }
        return { error: "request_too_large", status: 413 };
      }
      chunks.push(value);
    }
  } catch {
    return { error: "invalid_request", status: 400 };
  }

  const bytes = new Uint8Array(byteLength);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }

  try {
    const raw = new TextDecoder("utf-8", { fatal: true }).decode(bytes);
    return { body: JSON.parse(raw) };
  } catch {
    return { error: "invalid_request", status: 400 };
  }
}

export async function readBoundedText(request, maxBodyBytes) {
  const declaredLength = Number(request.headers.get("content-length") ?? 0);
  if (Number.isFinite(declaredLength) && declaredLength > maxBodyBytes) {
    return { error: "request_too_large", status: 413 };
  }
  if (!request.body) return { error: "invalid_request", status: 400 };

  const reader = request.body.getReader();
  const chunks = [];
  let byteLength = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      byteLength += value.byteLength;
      if (byteLength > maxBodyBytes) {
        try {
          await reader.cancel();
        } catch {
          // The request is already rejected; cancellation failure adds no value.
        }
        return { error: "request_too_large", status: 413 };
      }
      chunks.push(value);
    }
  } catch {
    return { error: "invalid_request", status: 400 };
  }

  const bytes = new Uint8Array(byteLength);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }
  try {
    return { text: new TextDecoder("utf-8", { fatal: true }).decode(bytes) };
  } catch {
    return { error: "invalid_request", status: 400 };
  }
}
