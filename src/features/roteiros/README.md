# Roteiros

Visão filtrada do banco de ideias (content_items) para conteúdos nos
status `researching`, `scripting` e `ready_to_record`. Implementado na
Fase 6.

- `roteiros-list.tsx` — lista agrupada por status (Server Component),
  cada card abre o workspace.
- `script-workspace.tsx` — workspace completo (briefing, ganchos, roteiro,
  estrutura por formato, checklist, histórico de versões, navegação de
  status), com autosave de rascunho e prevenção de perda ao sair.
- `hook-variations-field-array.tsx`, `script-structure-field-array.tsx`,
  `shot-list-field-array.tsx`, `script-checklist-section.tsx`,
  `version-history.tsx` — subcomponentes do workspace.
- `teleprompter-view.tsx` — modo teleprompter em tela cheia (fonte e
  velocidade ajustáveis, espelhar, manter tela acordada quando suportado).
- `script-form-types.ts` — tipos do formulário (todos os campos em
  string/array simples, conversão para o schema de validação acontece no
  servidor — ver `src/lib/validations/script.ts`).

Lógica pura (parse de jsonb, checklist, navegação de status, throttle de
versões) vive em `src/lib/script-workspace.ts`; a lógica do teleprompter
(limites de fonte/velocidade, cálculo de rolagem) vive em
`src/lib/teleprompter.ts` — ambos testados sem precisar de DOM/banco.

Geração de ganchos/roteiro por IA **não está integrada** ainda — só existe
um contrato de serviço desacoplado em `src/lib/services/script-assist.ts`,
sem nenhuma tela chamando-o.
