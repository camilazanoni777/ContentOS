# Publicados

Lista dos conteúdos já publicados (status `published`/`repurpose`), com:

- resumo de pendências de captura de métricas em 24h/7d/30d — comparando
  `published_at` + a duração de cada janela contra agora, e conferindo se já existe um
  `metric_snapshots` daquela janela para o conteúdo (`getCapturePendencies` em
  `src/lib/publicados.ts`);
- alerta visível quando falta a URL do post (`isMissingPublishedUrl`);
- ação "Duplicar como reaproveitamento" (`duplicateAsRepurposed`), que cria um novo
  `content_item` com `source_content_id` apontando para o original, recomeçando o
  pipeline em `idea` — o original nunca é alterado nem perde histórico
  (`repurposeContentItem` em `src/lib/data/content-items.ts`);
- comparação lado a lado entre a versão original e a reaproveitada
  (`RepurposeComparisonDialog`, usando `buildRepurposeComparison`).

Não simula publicação automática no Instagram — o app só gerencia o agendamento e o
registro de que algo foi publicado; qualquer integração real com a API do Instagram é
trabalho futuro, fora do escopo desta fase.
