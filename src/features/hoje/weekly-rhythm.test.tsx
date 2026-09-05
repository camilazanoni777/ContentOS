import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { WeeklyRhythm, type WeeklyRhythmDay } from "./weekly-rhythm";

describe("WeeklyRhythm", () => {
  const mockDays: WeeklyRhythmDay[] = [
    { date: "2026-09-01", dayLabel: "Seg", dayNumber: "01", isToday: false, hasCheckin: true, nightClosed: true, publishedCount: 1 },
    { date: "2026-09-02", dayLabel: "Ter", dayNumber: "02", isToday: false, hasCheckin: true, nightClosed: true, publishedCount: 0 },
    { date: "2026-09-03", dayLabel: "Qua", dayNumber: "03", isToday: false, hasCheckin: true, nightClosed: false, publishedCount: 1 },
    { date: "2026-09-04", dayLabel: "Qui", dayNumber: "04", isToday: false, hasCheckin: false, nightClosed: false, publishedCount: 0 },
    { date: "2026-09-05", dayLabel: "Sex", dayNumber: "05", isToday: true, hasCheckin: true, nightClosed: false, publishedCount: 1 },
    { date: "2026-09-06", dayLabel: "Sáb", dayNumber: "06", isToday: false, hasCheckin: false, nightClosed: false, publishedCount: 0 },
    { date: "2026-09-07", dayLabel: "Dom", dayNumber: "07", isToday: false, hasCheckin: false, nightClosed: false, publishedCount: 0 },
  ];

  it("renderiza os 7 dias da semana e a barra de meta semanal", () => {
    render(
      <WeeklyRhythm
        days={mockDays}
        publishedThisWeek={3}
        weeklyTarget={5}
        weeklyPercent={60}
      />,
    );

    expect(screen.getByText("Ritmo Semanal")).toBeInTheDocument();
    expect(screen.getByText("Seg")).toBeInTheDocument();
    expect(screen.getByText("Dom")).toBeInTheDocument();
    expect(screen.getByText("3/5")).toBeInTheDocument();
    expect(screen.getByText(/60%/)).toBeInTheDocument();
  });

  it("mostra link para definir meta quando weeklyTarget é nulo", () => {
    render(
      <WeeklyRhythm
        days={mockDays}
        publishedThisWeek={1}
        weeklyTarget={null}
        weeklyPercent={null}
      />,
    );

    expect(screen.getByRole("link", { name: /definir meta semanal/i })).toBeInTheDocument();
  });
});
