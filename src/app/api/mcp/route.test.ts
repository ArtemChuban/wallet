import { describe, it } from "vitest";

/**
 * Wave 0 Nyquist stubs (D-15 / HOST-01, HOST-02).
 * Plan 02 greens these with mocked createWalletMcpHandler.fetch.
 */
describe("POST/GET/DELETE /api/mcp (route smoke)", () => {
  it.todo("good Host calls handler.fetch");

  it.todo(
    "bad Host returns 403 reason bad_host and does not call handler.fetch",
  );
});
