import { describe, expect, it } from "vitest";
import { formatAsOfDisplay, parseAsOfDisplay } from "@/lib/dates";

describe("formatAsOfDisplay", () => {
  it("formats YYYY-MM-DD as DD.MM.YYYY", () => {
    expect(formatAsOfDisplay("2026-09-03")).toBe("03.09.2026");
  });
});

describe("parseAsOfDisplay", () => {
  it("parses DD.MM.YYYY to YYYY-MM-DD", () => {
    expect(parseAsOfDisplay("03.09.2026")).toBe("2026-09-03");
  });

  it("rejects US-shaped and garbage", () => {
    expect(parseAsOfDisplay("09/03/2026")).toBeNull();
    expect(parseAsOfDisplay("2026-09-03")).toBeNull();
    expect(parseAsOfDisplay("31.02.2026")).toBeNull();
  });
});
