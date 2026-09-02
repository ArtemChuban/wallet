import { describe, expect, it } from "vitest";
import {
  createCurrencySchema,
  updateCurrencyNameSchema,
} from "./currency";

describe("createCurrencySchema (CURR-01)", () => {
  it("accepts USDT with scale 0 and 18", () => {
    for (const scale of [0, 18] as const) {
      const result = createCurrencySchema.safeParse({
        code: "USDT",
        name: "Tether",
        scale,
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.code).toBe("USDT");
        expect(result.data.name).toBe("Tether");
        expect(result.data.scale).toBe(scale);
      }
    }
  });

  it("rejects scale -1 and 19 with Russian message", () => {
    for (const scale of [-1, 19] as const) {
      const result = createCurrencySchema.safeParse({
        code: "USDT",
        name: "Tether",
        scale,
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        const messages = result.error.issues.map((i) => i.message);
        expect(messages).toContain("Укажите масштаб от 0 до 18");
      }
    }
  });

  it("rejects empty or whitespace name and code", () => {
    for (const payload of [
      { code: "", name: "Рубль", scale: 2 },
      { code: "   ", name: "Рубль", scale: 2 },
      { code: "RUB", name: "", scale: 2 },
      { code: "RUB", name: "   ", scale: 2 },
    ]) {
      const result = createCurrencySchema.safeParse(payload);
      expect(result.success).toBe(false);
    }
  });

  it("trims printable ASCII code max 16", () => {
    const ok = createCurrencySchema.safeParse({
      code: "  ABC  ",
      name: "  Alpha  ",
      scale: 2,
    });
    expect(ok.success).toBe(true);
    if (ok.success) {
      expect(ok.data.code).toBe("ABC");
      expect(ok.data.name).toBe("Alpha");
    }

    const tooLong = createCurrencySchema.safeParse({
      code: "ABCDEFGHIJKLMNOPQ",
      name: "TooLong",
      scale: 2,
    });
    expect(tooLong.success).toBe(false);
  });
});

describe("updateCurrencyNameSchema (CURR-01 / D-08)", () => {
  it("accepts name only", () => {
    const result = updateCurrencyNameSchema.safeParse({ name: "Рубль" });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toEqual({ name: "Рубль" });
      expect(Object.keys(result.data)).toEqual(["name"]);
    }
  });

  it("rejects empty name", () => {
    expect(updateCurrencyNameSchema.safeParse({ name: "" }).success).toBe(false);
    expect(updateCurrencyNameSchema.safeParse({ name: "  " }).success).toBe(false);
  });
});
