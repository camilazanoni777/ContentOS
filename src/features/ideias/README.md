# Banco de Ideias

Registro central de conteúdo (ideia até publicado), pesquisável em tabela,
cards e Kanban. Todas as visualizações usam `content_items`; o drag-and-drop
apenas muda o `status` e o trigger do banco registra o histórico.

`content-pipeline.ts` concentra score, dias parados, alertas, filtros e
termômetro por pilar. As páginas de produção são recortes filtrados do mesmo
registro, sem cópias entre etapas.
