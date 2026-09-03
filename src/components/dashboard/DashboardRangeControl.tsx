"use client";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { RangePreset } from "@/lib/dates";

const PRESETS: { value: RangePreset; label: string }[] = [
  { value: "30d", label: "30д" },
  { value: "90d", label: "90д" },
  { value: "1y", label: "1г" },
  { value: "all", label: "всё" },
];

type DashboardRangeControlProps = {
  value: RangePreset;
  onChange: (preset: RangePreset) => void;
};

export function DashboardRangeControl({
  value,
  onChange,
}: DashboardRangeControlProps) {
  return (
    <div
      role="group"
      aria-label="Период"
      className="mb-4 flex flex-wrap gap-2"
    >
      {PRESETS.map((preset) => {
        const pressed = value === preset.value;
        return (
          <Button
            key={preset.value}
            type="button"
            variant={pressed ? "default" : "outline"}
            aria-pressed={pressed}
            className={cn("min-h-11 font-medium", pressed && "font-semibold")}
            onClick={() => onChange(preset.value)}
          >
            {preset.label}
          </Button>
        );
      })}
    </div>
  );
}
