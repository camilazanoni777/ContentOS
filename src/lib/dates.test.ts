import { describe, expect, it } from "vitest";
import {
  addDaysISO,
  changeInstantDate,
  dayInstantRange,
  fromDateTimeLocalInput,
  getHourLocal,
  getMonthEnd,
  getMonthStart,
  getPreviousEquivalentRange,
  getWeekdayLocal,
  getWeekRange,
  instantToISODate,
  rangeInstantBounds,
  toDateTimeLocalInput,
  toISODate,
} from "./dates";

describe("addDaysISO", () => {
  it("soma dias respeitando virada de mês", () => {
    expect(addDaysISO("2026-09-03", 1)).toBe("2026-09-04");
    expect(addDaysISO("2026-09-30", 1)).toBe("2026-10-01");
  });
});

describe("getWeekRange", () => {
  it("semana de segunda a domingo contendo a data", () => {
    // 2026-09-03 é uma quinta-feira.
    expect(getWeekRange("2026-09-03")).toEqual({ start: "2026-08-31", end: "2026-09-06" });
  });

  it("uma segunda-feira é o início da própria semana", () => {
    expect(getWeekRange("2026-08-31").start).toBe("2026-08-31");
  });
});

describe("getMonthStart", () => {
  it("retorna o primeiro dia do mês da data", () => {
    expect(getMonthStart("2026-09-17")).toBe("2026-09-01");
  });
});

describe("dayInstantRange", () => {
  it("limites do dia como instantes timestamptz no timezone do produto (UTC-03:00)", () => {
    expect(dayInstantRange("2026-09-03")).toEqual({
      startInstant: "2026-09-03T00:00:00-03:00",
      endInstant: "2026-09-04T00:00:00-03:00",
    });
  });
});

describe("rangeInstantBounds", () => {
  it("limites de um intervalo de dias (inclusive nos dois extremos)", () => {
    expect(rangeInstantBounds("2026-08-31", "2026-09-06")).toEqual({
      startInstant: "2026-08-31T00:00:00-03:00",
      endInstant: "2026-09-07T00:00:00-03:00",
    });
  });
});

describe("toISODate", () => {
  it("formata como YYYY-MM-DD com zero à esquerda", () => {
    expect(toISODate(new Date(2026, 0, 5))).toBe("2026-01-05");
  });
});

describe("getMonthEnd", () => {
  it("retorna o último dia do mês, respeitando meses com 28/30/31 dias", () => {
    expect(getMonthEnd("2026-09-05")).toBe("2026-09-30");
    expect(getMonthEnd("2026-02-10")).toBe("2026-02-28");
    expect(getMonthEnd("2026-01-15")).toBe("2026-01-31");
  });
});

describe("instantToISODate", () => {
  it("converte um instante timestamptz para a data local do produto (UTC-03:00)", () => {
    // 02:30 UTC de 04/09 é 23:30 de 03/09 em UTC-03:00 — não pode "vazar" para o dia seguinte.
    expect(instantToISODate("2026-09-04T02:30:00.000Z")).toBe("2026-09-03");
    expect(instantToISODate("2026-09-04T04:00:00.000Z")).toBe("2026-09-04");
  });
});

describe("changeInstantDate", () => {
  it("troca só a data, preservando a hora local (mesmo perto da virada do dia)", () => {
    // 23:30 em UTC-03:00 no dia 03/09 -> instante UTC 2026-09-04T02:30:00.
    const original = "2026-09-04T02:30:00.000Z";
    const moved = changeInstantDate(original, "2026-09-10");
    expect(moved).toBe("2026-09-10T23:30:00-03:00");
    // A hora local continua 23:30 no novo dia, não "vaza" para o dia seguinte.
    expect(instantToISODate(moved)).toBe("2026-09-10");
  });

  it("sem instante original, assume meio-dia local", () => {
    expect(changeInstantDate(null, "2026-09-10")).toBe("2026-09-10T12:00:00-03:00");
    expect(changeInstantDate(undefined, "2026-09-10")).toBe("2026-09-10T12:00:00-03:00");
  });
});

describe("toDateTimeLocalInput / fromDateTimeLocalInput", () => {
  it("são inversas uma da outra (round-trip)", () => {
    const instant = "2026-09-10T18:45:00-03:00";
    const asInput = toDateTimeLocalInput(instant);
    expect(asInput).toBe("2026-09-10T18:45");
    expect(fromDateTimeLocalInput(asInput)).toBe("2026-09-10T18:45:00-03:00");
  });

  it("toDateTimeLocalInput de null/vazio é string vazia; fromDateTimeLocalInput de vazio é null", () => {
    expect(toDateTimeLocalInput(null)).toBe("");
    expect(toDateTimeLocalInput(undefined)).toBe("");
    expect(fromDateTimeLocalInput("")).toBeNull();
    expect(fromDateTimeLocalInput(null)).toBeNull();
    expect(fromDateTimeLocalInput(undefined)).toBeNull();
  });

  it("interpreta o valor do input como hora local do produto, não do navegador/servidor", () => {
    // Independente de onde o código roda, "meio-dia digitado" deve virar meio-dia em UTC-03:00.
    expect(fromDateTimeLocalInput("2026-12-25T12:00")).toBe("2026-12-25T12:00:00-03:00");
  });
});


describe("getWeekdayLocal", () => {
  it("dia da semana local (0=domingo...6=sábado) de um instante timestamptz", () => {
    // 2026-09-03 é uma quinta-feira; meio-dia UTC-03:00 não cruza a virada do dia.
    expect(getWeekdayLocal("2026-09-03T15:00:00.000Z")).toBe(4);
  });

  it("não vaza para o dia seguinte perto da virada (madrugada UTC = noite local do dia anterior)", () => {
    // 02:30 UTC de 04/09 é 23:30 de 03/09 (quinta) em UTC-03:00.
    expect(getWeekdayLocal("2026-09-04T02:30:00.000Z")).toBe(4);
    // Já 04:00 UTC de 04/09 é 01:00 de 04/09 (sexta) em UTC-03:00.
    expect(getWeekdayLocal("2026-09-04T04:00:00.000Z")).toBe(5);
  });
});

describe("getHourLocal", () => {
  it("hora local (0-23) de um instante timestamptz", () => {
    expect(getHourLocal("2026-09-03T15:00:00.000Z")).toBe(12);
  });

  it("não vaza para o dia seguinte perto da virada", () => {
    expect(getHourLocal("2026-09-04T02:30:00.000Z")).toBe(23);
    expect(getHourLocal("2026-09-04T04:00:00.000Z")).toBe(1);
  });
});

describe("getPreviousEquivalentRange", () => {
  it("período anterior de mesmo tamanho, imediatamente antes (semana de 7 dias)", () => {
    expect(getPreviousEquivalentRange("2026-08-31", "2026-09-06")).toEqual({ start: "2026-08-24", end: "2026-08-30" });
  });

  it("funciona para qualquer tamanho de período, não só semanas", () => {
    expect(getPreviousEquivalentRange("2026-09-01", "2026-09-01")).toEqual({ start: "2026-08-31", end: "2026-08-31" });
    expect(getPreviousEquivalentRange("2026-09-01", "2026-09-30")).toEqual({ start: "2026-08-02", end: "2026-08-31" });
  });
});
