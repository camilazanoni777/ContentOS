# Gravação

Página Gravação (Prompt 7): conteúdos `ready_to_record`/`recorded` de
`content_items`, em três modos — lista, cards e sessão em lote.

- `gravacao-workspace.tsx` — componente principal (modos, filtros/busca,
  checklist de gravação por conteúdo, "Marcar como gravado").
- `session-panel.tsx` — painel de uma sessão de gravação (`recording_sessions`
  + `recording_session_items`): reordenar (arrastar ou botões subir/descer)
  para reduzir trocas de cenário/roupa, remover item, marcar gravado.
- `session-form-dialog.tsx` / `session-form-types.ts` — criar/editar uma
  sessão (data, local, cenário, roupa, equipamento, tempo disponível,
  observações).
- `recording-checklist-section.tsx` — checklist fixo de 8 itens
  (`content_items.recording_checklist`), orientativo.
- `stopwatch.tsx` — cronômetro opcional, só estado local (não persiste).

O modo teleprompter fica em `src/features/roteiros/` (`/roteiros/[id]/teleprompter`),
não aqui — pertence ao workspace de roteirização, não à página Gravação.

Lógica pura em `src/lib/recording.ts` (checklist, filtros, reordenar,
formatação de tempo).
