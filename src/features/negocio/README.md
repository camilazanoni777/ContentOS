# Negócio

Implementado na Fase 12: campanhas/parcerias, entregáveis, conteúdos
vinculados, parcelas e recebimentos, produtos, vendas atribuídas e resumo
financeiro por período.

A fonte de verdade de vendas é `sales_records`: uma linha manual guarda seus
próprios números; uma linha com `source = metric_snapshot` referencia uma única
captura de `metric_snapshots` e deriva dela cliques, leads, vendas e receita.
Esses números nunca são copiados para a linha, e o índice único em
`metric_snapshot_id` impede somar a mesma captura duas vezes.

Receita total neste domínio significa recebimentos confirmados de campanhas +
receita de produtos atribuída no livro-razão. `profile_snapshots` não entra
nesse total porque é um agregado diário sem atribuição e poderia repetir os
mesmos resultados.
