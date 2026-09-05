# Configurações, importação e backup

`/configuracoes` edita taxonomias, séries, checklist, metas e limites. Opções removidas são arquivadas/desativadas; `replace_taxonomy_option` substitui referências em transação e grava auditoria.

O importador aceita apenas `.xlsx` (10 MB por padrão, configurável por `IMPORT_MAX_BYTES`), lê valores com ExcelJS sem executar macros ou fórmulas, ignora abas ocultas, `Cálculos` e `Exemplos`, reconcilia Banco de Ideias e Conteúdos pelo ID legado e exige confirmação. O hash SHA-256 torna o lote idempotente. A fixture de teste é fictícia porque a planilha original não está no repositório.

O backup JSON usa `schema_version: 1.0`; CSV pode ser solicitado por módulo e período no endpoint `/api/backup`. Veja `docs/restauracao-backup.md`.
