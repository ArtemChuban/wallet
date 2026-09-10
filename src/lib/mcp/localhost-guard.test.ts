import { afterEach, describe, expect, it, vi } from "vitest";
import { withLocalhostGuard } from "./localhost-guard";

function req(headers: Record<string, string>): Request {
  return new Request("http://127.0.0.1:3000/api/mcp", {
    method: "POST",
    headers,
  });
}

describe("localhost-guard (HOST-02)", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("allows Host 127.0.0.1 with listen PORT and missing Origin", () => {
    vi.stubEnv("PORT", "3000");
    expect(withLocalhostGuard(req({ host: "127.0.0.1:3000" }))).toBeUndefined();
  });

  it.todo("allows Host localhost with listen PORT and missing Origin");

  it.todo("allows Host [::1] with listen PORT and missing Origin");

  it("rejects evil Host with 403 reason bad_host", async () => {
    vi.stubEnv("PORT", "3000");
    const res = withLocalhostGuard(req({ host: "evil.com:3000" }));
    expect(res).toBeDefined();
    expect(res!.status).toBe(403);
    await expect(res!.json()).resolves.toEqual({
      error: "Forbidden",
      reason: "bad_host",
    });
  });

  it.todo("rejects wrong Host port vs PORT with 403 reason bad_host");

  it.todo("rejects non-loopback Origin even when Host is good (403 bad_origin)");

  it.todo("allows good Host with loopback Origin");
});
