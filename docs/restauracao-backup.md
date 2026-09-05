# Restauração de backup

O download JSON é um backup lógico completo e versionado, mas a restauração automática não faz parte da fase 13.

Antes de restaurar: confira `schema_version`, valide que `owner.user_id` corresponde à pessoa autenticada, aplique todas as migrations no destino, preserve IDs e relações e faça a carga em uma única transação administrativa. Valide contagens, chaves estrangeiras e isolamento RLS antes de liberar o ambiente. Nunca importe o envelope diretamente pelo navegador nem troque o `user_id` sem uma migração de propriedade revisada.

Uma restauração deve ser testada primeiro em projeto Supabase descartável. O CSV é para análise/intercâmbio e não constitui backup relacional restaurável.
