# Agendamento

Workspace por conteúdo (`/agendamento/[id]`) para conteúdos em status `scheduled` — a
etapa final antes de publicar. Reaproveita `content_items` como fonte única de dados
(nenhuma tabela nova): data/hora planejadas (`scheduled_at`), legenda final
(`caption`), palavras-chave/hashtags (`hashtags`, um campo de texto no formulário
convertido para array — ver `parseHashtagsInput`/`formatHashtagsForInput` em
`src/lib/agendamento.ts`), CTA (`cta`), campanha/produto (`campaign_id`/`product_id`),
capa (reaproveita `cover_notes`, já usado pela Edição) e um checklist final fixo de 6
itens (`scheduling_checklist`, orientativo, nunca bloqueia).

Autosave com debounce (mesmo hook `useAutosave` das demais fases). A regra central da
página é "nunca publicado sem data real": o diálogo "Marcar como publicado"
(`mark-as-published-dialog.tsx`) exige uma data/hora real antes de mudar o status para
`published` — reforçado tanto no formulário (Zod, `markAsPublishedSchema`) quanto por
um CHECK constraint no banco (`content_items_published_requires_published_at`, ver
migration `20260904160000`). A URL do post é opcional nesse momento — pode ser
adicionada depois (ação `updatePublishedUrl`), com alerta visível na lista e no
workspace enquanto faltar.
