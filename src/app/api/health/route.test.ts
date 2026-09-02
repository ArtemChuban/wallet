import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/db", () => ({
  prisma: {
    $queryRaw: vi.fn(),
  },
  ensureSqlitePragmas: vi.fn(),
}));

import { GET } from "./route";
import { ensureSqlitePragmas, prisma } from "@/lib/db";

describe("GET /api/health", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 503 when database is unreachable", async () => {
    vi.mocked(ensureSqlitePragmas).mockRejectedValue(new Error("db missing"));

    const res = await GET();

    expect(res.status).toBe(503);
    await expect(res.json()).resolves.toEqual({ status: "not_ready" });
  });

  it("returns 503 when migrations are missing", async () => {
    vi.mocked(ensureSqlitePragmas).mockResolvedValue(undefined);
    vi.mocked(prisma.$queryRaw)
      .mockResolvedValueOnce([{ ok: 1 }])
      .mockResolvedValueOnce([{ c: 0 }]);

    const res = await GET();

    expect(res.status).toBe(503);
    await expect(res.json()).resolves.toEqual({ status: "not_ready" });
  });

  it("returns 200 ok when SQLite is migrated", async () => {
    vi.mocked(ensureSqlitePragmas).mockResolvedValue(undefined);
    vi.mocked(prisma.$queryRaw)
      .mockResolvedValueOnce([{ ok: 1 }])
      .mockResolvedValueOnce([{ c: 1n }]);

    const res = await GET();

    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual({ status: "ok" });
  });
});
