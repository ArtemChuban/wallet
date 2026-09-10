import {
  localhostAllowedHostnames,
  localhostAllowedOrigins,
  validateHostHeader,
  validateOriginHeader,
} from "@modelcontextprotocol/server";

export type GuardRejectReason = "bad_host" | "bad_origin";

function listenPort(): string {
  return process.env.PORT ?? "3000";
}

/** Host must include an explicit port equal to listen PORT (D-03, A1). */
function hostPortOk(hostHeader: string | null): boolean {
  if (!hostHeader) return false;
  try {
    const port = new URL(`http://${hostHeader}`).port;
    return port === listenPort();
  } catch {
    return false;
  }
}

function reject(reason: GuardRejectReason, host: string | null, origin: string | null): Response {
  console.warn(`[mcp] reject ${reason}`, { host, origin });
  return Response.json({ error: "Forbidden", reason }, { status: 403 });
}

/**
 * DNS-rebinding defense for /api/mcp: loopback Host + PORT match + Origin allowlist.
 * Missing Origin allowed (CLI). Do not use SDK *ValidationResponse helpers (wrong body).
 */
export function withLocalhostGuard(req: Request): Response | undefined {
  const host = req.headers.get("host");
  const origin = req.headers.get("origin");

  const hostResult = validateHostHeader(host, localhostAllowedHostnames());
  if (!hostResult.ok || !hostPortOk(host)) {
    return reject("bad_host", host, origin);
  }

  const originResult = validateOriginHeader(origin, localhostAllowedOrigins());
  if (!originResult.ok) {
    return reject("bad_origin", host, origin);
  }

  return undefined;
}
