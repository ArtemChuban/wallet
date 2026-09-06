import { describe, expect, it } from "vitest";
import { resolveForgiveActionError } from "@/components/debts/forgive-action-error";

describe("resolveForgiveActionError (G-10-8 / WR-01)", () => {
  it("prefers deltaMajor over opaque when message absent", () => {
    expect(
      resolveForgiveActionError({
        errors: {
          deltaMajor: ["Изменение сделало бы остаток отрицательным"],
        },
      }),
    ).toBe("Изменение сделало бы остаток отрицательным");
  });

  it("surfaces stale refresh message", () => {
    expect(
      resolveForgiveActionError({
        message: "Долг или запись не найдены. Обновите страницу.",
      }),
    ).toBe("Долг или запись не найдены. Обновите страницу.");
  });

  it("prefers asOfDate over deltaMajor and message", () => {
    expect(
      resolveForgiveActionError({
        message: "Долг или запись не найдены. Обновите страницу.",
        errors: {
          asOfDate: ["Дата не может быть раньше даты открытия"],
          deltaMajor: ["Изменение сделало бы остаток отрицательным"],
        },
      }),
    ).toBe("Дата не может быть раньше даты открытия");
  });

  it("falls back to opaque only when nothing actionable", () => {
    expect(resolveForgiveActionError({})).toBe(
      "Не удалось сохранить. Проверьте поля и попробуйте снова.",
    );
  });
});
