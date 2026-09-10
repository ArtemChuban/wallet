import { describe, it } from "vitest";

/**
 * Wave 0 Nyquist stubs (SIDE-04).
 * Later plans green get_forecast_overlay sparse series + default horizon.
 */
describe("get_forecast_overlay (SIDE-04)", () => {
  it.todo("returns sparse forecast points matching buildNetWorthForecastSeries shape");

  it.todo("includes income + A′ grace forecastEvents (D-01, D-03)");

  it.todo("omitted horizonEnd defaults to today+365 (D-04); UI-parity keys only");
});
