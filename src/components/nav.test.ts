import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const navSrc = readFileSync("src/components/nav.tsx", "utf8");

describe("nav DNAV-01 / D-18", () => {
  it("orders Главная · Счета · Доходы · Долги · Валюты with correct hrefs", () => {
    expect(navSrc).toMatch(/href:\s*"\/"/);
    expect(navSrc).toMatch(/href:\s*"\/accounts"/);
    expect(navSrc).toMatch(/href:\s*"\/income"/);
    expect(navSrc).toMatch(/href:\s*"\/debts"/);
    expect(navSrc).toMatch(/href:\s*"\/currencies\/rates"/);

    const hrefMatches = [
      ...navSrc.matchAll(/href:\s*"([^"]+)"/g),
    ].map((m) => m[1]);
    expect(hrefMatches).toEqual([
      "/",
      "/accounts",
      "/income",
      "/debts",
      "/currencies/rates",
    ]);

    const labelMatches = [
      ...navSrc.matchAll(/label:\s*"([^"]+)"/g),
    ].map((m) => m[1]);
    expect(labelMatches).toEqual([
      "Главная",
      "Счета",
      "Доходы",
      "Долги",
      "Валюты",
    ]);
  });
});
