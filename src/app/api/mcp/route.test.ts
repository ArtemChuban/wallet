import { beforeEach, describe, expect, it, vi } from "vitest";

const { fetchMock } = vi.hoisted(() => ({
  fetchMock: vi.fn(),
}));

vi.mock("@/lib/mcp/create-handler", () => ({
  createWalletMcpHandler: () => ({ fetch: fetchMock }),
}));

import { POST } from "./route";

describe("POST/GET/DELETE /api/mcp (route smoke)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    fetchMock.mockResolvedValue(Response.json({ ok: true }));
  });

  it("good Host calls handler.fetch", async () => {
    const request = new Request("http://127.0.0.1:3000/api/mcp", {
      method: "POST",
      headers: { host: "127.0.0.1:3000" },
    });
    const res = await POST(request);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock).toHaveBeenCalledWith(request);
    expect(res.status).toBe(200);
  });

  it("bad Host returns 403 reason bad_host and does not call handler.fetch", async () => {
    const request = new Request("http://127.0.0.1:3000/api/mcp", {
      method: "POST",
      headers: { host: "evil.com:3000" },
    });
    const res = await POST(request);
    expect(fetchMock).not.toHaveBeenCalled();
    expect(res.status).toBe(403);
    await expect(res.json()).resolves.toEqual({
      error: "Forbidden",
      reason: "bad_host",
    });
  });
});
