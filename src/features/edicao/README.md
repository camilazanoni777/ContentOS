# Edição

Página Edição (Prompt 7): lista (`edicao-list.tsx`) dos conteúdos
`recorded`/`editing`/`awaiting_approval` de `content_items`, com filtros,
busca e indicador de atraso; cada card abre o workspace completo em
`/edicao/[id]` (`edicao-workspace.tsx`).

- `edicao-workspace.tsx` — arquivos (links), editor responsável,
  instruções de edição, referências visuais, notas (cortes/texto na
  tela/legendas/áudio/capa), prazo, checklist de qualidade (9 itens fixos),
  autosave com indicador de salvo e prevenção de perda ao sair. Ações
  "Iniciar edição"/"Enviar para aprovação"/"Aprovar" avançam o pipeline.
- `visual-references-field-array.tsx` — lista editável de referências
  visuais (rótulo + link).
- `edit-checklist-section.tsx` — checklist fixo de qualidade da edição.
- `review-comments.tsx` — comentários/revisões (`content_review_comments`),
  status aberto/resolvido, pode reabrir.

Upload de arquivo (Supabase Storage) ainda não está integrado — só link
por enquanto; ver `src/lib/services/file-upload.ts` (contrato desacoplado
para quando Storage for configurado).

Lógica pura em `src/lib/editing.ts` (parse de jsonb, checklist, atraso de
prazo, filtros).
