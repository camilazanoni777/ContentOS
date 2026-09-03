"use client";

import * as React from "react";
import { CalendarRange } from "lucide-react";

import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

export interface DateRange {
  from: string | null;
  to: string | null;
}

interface DateRangePickerProps {
  value: DateRange;
  onChange: (range: DateRange) => void;
  className?: string;
}

const PRESETS: { label: string; days: number }[] = [
  { label: "7 dias", days: 7 },
  { label: "30 dias", days: 30 },
  { label: "90 dias", days: 90 },
];

function isoDaysAgo(days: number): string {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date.toISOString().slice(0, 10);
}

/**
 * Seletor de período simples (dois campos de data + atalhos), pensado para
 * uso em FilterBar. Não depende de biblioteca de calendário externa —
 * suficiente para filtrar métricas/listagens por período.
 */
export function DateRangePicker({ value, onChange, className }: DateRangePickerProps) {
  return (
    <div className={cn("flex flex-wrap items-end gap-3", className)}>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="date-range-from" className="text-xs text-muted-foreground">
          De
        </Label>
        <Input
          id="date-range-from"
          type="date"
          value={value.from ?? ""}
          onChange={(e) => onChange({ ...value, from: e.target.value || null })}
          className="h-9 w-[9.5rem]"
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="date-range-to" className="text-xs text-muted-foreground">
          Até
        </Label>
        <Input
          id="date-range-to"
          type="date"
          value={value.to ?? ""}
          onChange={(e) => onChange({ ...value, to: e.target.value || null })}
          className="h-9 w-[9.5rem]"
        />
      </div>
      <div className="flex items-center gap-1.5" role="group" aria-label="Atalhos de período">
        {PRESETS.map((preset) => (
          <Button
            key={preset.label}
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onChange({ from: isoDaysAgo(preset.days), to: isoDaysAgo(0) })}
          >
            <CalendarRange className="h-3.5 w-3.5" aria-hidden="true" />
            {preset.label}
          </Button>
        ))}
      </div>
    </div>
  );
}
