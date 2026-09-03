import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const dialogSrc = readFileSync(
  "src/components/currencies/CurrencyFormDialog.tsx",
  "utf8",
);
const listSrc = readFileSync(
  "src/components/currencies/CurrencyList.tsx",
  "utf8",
);

describe("CurrencyFormDialog pending UX (CURR-01 / 02-02-02)", () => {
  it("shows Сохранение… and disables submit while isPending", () => {
    expect(dialogSrc).toMatch(/isPending\s*\?\s*["']Сохранение…["']/);
    expect(dialogSrc).toMatch(
      /<Button[^>]*type=["']submit["'][^>]*disabled=\{isPending\}/,
    );
  });

  it("uses outline (or ghost) for default edit row CTA", () => {
    expect(dialogSrc).toMatch(
      /variant=["'](outline|ghost)["'][\s\S]*?Изменить|Изменить[\s\S]*?variant=["'](outline|ghost)["']/,
    );
    expect(listSrc).toMatch(/CurrencyFormDialog\s+mode=["']edit["']/);
    expect(listSrc).toMatch(/Основная|isPrimary/);
  });
});

describe("CurrencyFormDialog controlled name (CURR-01 / G-02-1 / 02-05-01)", () => {
  it("binds currency-name Input from mount-init useState — no defaultValue", () => {
    expect(dialogSrc).toMatch(
      /const\s*\[\s*name\s*,\s*setName\s*\]\s*=\s*useState/,
    );
    expect(dialogSrc).toMatch(/id=["']currency-name["']/);
    expect(dialogSrc).toMatch(/value=\{name\}/);
    expect(dialogSrc).toMatch(/onChange=\{/);
    expect(dialogSrc.match(/defaultValue/g) ?? []).toHaveLength(0);
  });
});
