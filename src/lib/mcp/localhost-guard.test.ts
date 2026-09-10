import { afterEach, describe, expect, it, vi } from "vitest";
import { withLocalhostGuard } from "./localhost-guard";

function req(headers: Record<string, string>): Request {
  return new Request("http://127.0.0.1:3000/api/mcp", {
    method: "POST",
    headers,
  });
}

async function expectBadHost(headers: Record<string, string>) {
  const res = withLocalhostGuard(req(headers));
  expect(res).toBeDefined();
  expect(res!.status).toBe(403);
  await expect(res!.json()).resolves.toEqual({
    error: "Forbidden",
    reason: "bad_host",
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

  it("allows Host localhost with listen PORT and missing Origin", () => {
    vi.stubEnv("PORT", "3000");
    expect(withLocalhostGuard(req({ host: "localhost:3000" }))).toBeUndefined();
  });

  it("allows Host [::1] with listen PORT and missing Origin", () => {
    vi.stubEnv("PORT", "3000");
    expect(withLocalhostGuard(req({ host: "[::1]:3000" }))).toBeUndefined();
  });

  it("rejects evil Host with 403 reason bad_host", async () => {
    vi.stubEnv("PORT", "3000");
    await expectBadHost({ host: "evil.com:3000" });
  });

  it("rejects wrong Host port vs PORT with 403 reason bad_host", async () => {
    vi.stubEnv("PORT", "3000");
    await expectBadHost({ host: "127.0.0.1:9999" });
  });

  it("rejects missing Host port when PORT=3000 with 403 reason bad_host", async () => {
    vi.stubEnv("PORT", "3000");
    await expectBadHost({ host: "127.0.0.1" });
  });

  it("rejects non-loopback Origin even when Host is good (403 bad_origin)", async () => {
    vi.stubEnv("PORT", "3000");
    const res = withLocalhostGuard(
      req({ host: "127.0.0.1:3000", origin: "https://evil.com" }),
    );
    expect(res).toBeDefined();
    expect(res!.status).toBe(403);
    await expect(res!.json()).resolves.toEqual({
      error: "Forbidden",
      reason: "bad_origin",
    });
  });

  it("allows good Host with loopback Origin", () => {
    vi.stubEnv("PORT", "3000");
    expect(
      withLocalhostGuard(
        req({
          host: "127.0.0.1:3000",
          origin: "http://127.0.0.1:3000",
        }),
      ),
    ).toBeUndefined();
  });
});
