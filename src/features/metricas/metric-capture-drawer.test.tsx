import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

const saveMetricSnapshotMock = vi.fn();
const removeMetricSnapshotMock = vi.fn();

vi.mock("@/lib/actions/metricas", () => ({
  saveMetricSnapshot: (...args: unknown[]) => saveMetricSnapshotMock(...args),
  removeMetricSnapshot: (...args: unknown[]) => removeMetricSnapshotMock(...args),
}));

import { MetricCaptureDrawer } from "./metric-capture-drawer";
import type { MetricSnapshot } from "@/types/domain";

function makeSnapshot(overrides: Partial<MetricSnapshot> = {}): MetricSnapshot {
  return {
    id: "snap-1",
    content_item_id: "item-1",
    user_id: "user-1",
    window_type: "7d",
    window_start: null,
    window_end: null,
    captured_at: "2026-09-02T12:00:00.000Z",
    views: 1000,
    reach: 800,
    impressions: null,
    likes: 40,
    comments: 5,
    shares: 10,
    saves: 8,
    replies: null,
    profile_visits: null,
    followers_gained: 3,
    link_clicks: null,
    leads: null,
    sales: null,
    revenue: null,
    average_watch_time_seconds: null,
    video_duration_seconds: null,
    three_second_views: null,
    completed_views: null,
    retention_rate: 55,
    story_exits: null,
    taps_forward: null,
    taps_back: null,
    created_at: "2026-09-02T12:00:00.000Z",
    ...overrides,
  };
}

describe("MetricCaptureDrawer", () => {
  beforeEach(() => {
    saveMetricSnapshotMock.mockReset();
    removeMetricSnapshotMock.mockReset();
  });

  it("abre no modo rápido, mostrando só os campos essenciais", () => {
    render(
      <MetricCaptureDrawer
        open
        onOpenChange={() => {}}
        contentItemId="item-1"
        snapshots={[]}
        onSaved={() => {}}
        onDeleted={() => {}}
      />,
    );
    expect(screen.getByLabelText("Views")).toBeInTheDocument();
    expect(screen.getByLabelText("Curtidas")).toBeInTheDocument();
    expect(screen.queryByLabelText("Retenção informada (%)")).not.toBeInTheDocument();
  });

  it("alterna para o modo completo e mostra os campos de vídeo/retenção e stories", async () => {
    const user = userEvent.setup();
    render(
      <MetricCaptureDrawer
        open
        onOpenChange={() => {}}
        contentItemId="item-1"
        snapshots={[]}
        onSaved={() => {}}
        onDeleted={() => {}}
      />,
    );
    await user.click(screen.getByRole("button", { name: "Completo" }));
    expect(screen.getByLabelText("Retenção informada (%)")).toBeInTheDocument();
    expect(screen.getByLabelText("Saídas de stories")).toBeInTheDocument();
  });

  it("campo em branco é enviado como string vazia — nunca preenchido com zero", async () => {
    saveMetricSnapshotMock.mockResolvedValue({ success: true, snapshot: makeSnapshot() });
    const user = userEvent.setup();
    render(
      <MetricCaptureDrawer
        open
        onOpenChange={() => {}}
        contentItemId="item-1"
        snapshots={[]}
        onSaved={() => {}}
        onDeleted={() => {}}
      />,
    );
    await user.type(screen.getByLabelText("Views"), "1500");
    await user.click(screen.getByRole("button", { name: "Salvar captura" }));

    await waitFor(() => expect(saveMetricSnapshotMock).toHaveBeenCalled());
    const [, values] = saveMetricSnapshotMock.mock.calls[0];
    expect(values.views).toBe("1500");
    expect(values.reach).toBe("");
    expect(values.likes).toBe("");
  });

  it("pré-preenche ao editar uma captura existente e permite excluir", async () => {
    removeMetricSnapshotMock.mockResolvedValue({ success: true });
    const onDeleted = vi.fn();
    const user = userEvent.setup();
    const snapshot = makeSnapshot();
    render(
      <MetricCaptureDrawer
        open
        onOpenChange={() => {}}
        contentItemId="item-1"
        snapshots={[snapshot]}
        editSnapshot={snapshot}
        onSaved={() => {}}
        onDeleted={onDeleted}
      />,
    );
    expect(screen.getByLabelText("Views")).toHaveValue(1000);
    expect(screen.getByLabelText("Curtidas")).toHaveValue(40);

    await user.click(screen.getByRole("button", { name: /Excluir captura/ }));
    await waitFor(() => expect(removeMetricSnapshotMock).toHaveBeenCalledWith("item-1", "snap-1"));
    expect(onDeleted).toHaveBeenCalledWith("snap-1");
  });

  it("trocar de campo escondido no modo rápido não perde o valor já preenchido no modo completo", async () => {
    saveMetricSnapshotMock.mockResolvedValue({ success: true, snapshot: makeSnapshot() });
    const user = userEvent.setup();
    const snapshot = makeSnapshot({ retention_rate: 42 });
    render(
      <MetricCaptureDrawer
        open
        onOpenChange={() => {}}
        contentItemId="item-1"
        snapshots={[snapshot]}
        editSnapshot={snapshot}
        onSaved={() => {}}
        onDeleted={() => {}}
      />,
    );
    // Já abre no modo rápido (retenção fica escondida) — mas o valor de
    // retenção da captura existente (42) precisa sobreviver ao envio mesmo
    // sem o campo estar visível na tela.
    expect(screen.queryByLabelText("Retenção informada (%)")).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Salvar captura" }));
    await waitFor(() => expect(saveMetricSnapshotMock).toHaveBeenCalled());
    const [, values] = saveMetricSnapshotMock.mock.calls[0];
    expect(values.retentionRate).toBe("42");
  });

  it("janela personalizada mostra os campos de início/fim do período", async () => {
    const user = userEvent.setup();
    render(
      <MetricCaptureDrawer
        open
        onOpenChange={() => {}}
        contentItemId="item-1"
        snapshots={[]}
        onSaved={() => {}}
        onDeleted={() => {}}
      />,
    );
    const windowSelect = screen.getByLabelText("Janela desta leitura");
    await user.selectOptions(windowSelect, "custom");
    expect(screen.getByLabelText("Início do período")).toBeInTheDocument();
    expect(screen.getByLabelText("Fim do período")).toBeInTheDocument();
  });

  it("mostra a mensagem de erro devolvida pelo servidor e não fecha o drawer", async () => {
    saveMetricSnapshotMock.mockResolvedValue({ error: "Não foi possível salvar a captura de métricas." });
    const onOpenChange = vi.fn();
    const user = userEvent.setup();
    render(
      <MetricCaptureDrawer
        open
        onOpenChange={onOpenChange}
        contentItemId="item-1"
        snapshots={[]}
        onSaved={() => {}}
        onDeleted={() => {}}
      />,
    );
    await user.click(screen.getByRole("button", { name: "Salvar captura" }));
    await waitFor(() => expect(screen.getByText("Não foi possível salvar a captura de métricas.")).toBeInTheDocument());
    expect(onOpenChange).not.toHaveBeenCalledWith(false);
  });
});
