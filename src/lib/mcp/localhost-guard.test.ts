import { describe, it } from "vitest";

/**
 * Wave 0 Nyquist stubs (D-15 / HOST-02).
 * Plan 02 greens these against localhost-guard.ts.
 */
describe("localhost-guard (HOST-02)", () => {
  it.todo("allows Host 127.0.0.1 with listen PORT and missing Origin");

  it.todo("allows Host localhost with listen PORT and missing Origin");

  it.todo("allows Host [::1] with listen PORT and missing Origin");

  it.todo("rejects evil Host with 403 reason bad_host");

  it.todo("rejects wrong Host port vs PORT with 403 reason bad_host");

  it.todo("rejects non-loopback Origin even when Host is good (403 bad_origin)");

  it.todo("allows good Host with loopback Origin");
});
