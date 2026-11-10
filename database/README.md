# Banco de dados — Entrega 3

MySQL >= 8.0.16, com InnoDB, CHECKs, chaves estrangeiras e triggers. A API usa mysql2/promise e retorna datas como strings, preservando YYYY-MM-DD sem conversão de fuso.

## Instalação nova

Crie e selecione organiza_ai. Importe organiza_ai.sql uma única vez pelo MySQL Workbench/cliente que suporte DELIMITER. O script contém estrutura e triggers, sem registros de teste. Configure a conexão apenas em backend/.env, fora do Git.

## Banco existente

Não reimporte o script completo nem reaplique migrations/001_vinculos_acompanhamento.sql. Segundo o [registro anterior](VALIDACAO_ETAPA_4_1.md), a migração já foi aplicada ao ambiente principal em 09/11/2026. A revisão final não altera esquema nem registros.

Para outro ambiente ainda não migrado, planeje aplicação separada com backup privado, restauração de teste, conferência de versão/estrutura e autorização do responsável pelo banco. DDL MySQL faz commit implícito; não conte com ROLLBACK para desfazer migração parcial. Não use --force nem remova tabelas para reaplicar.

## Estrutura atual

- usuarios: nome, e-mail único, hash de senha, perfil aluno/responsavel.
- materias: pertencem a um usuário; nome, professor e cor.
- tarefas: pertencem a um usuário; descrição, prazo, prioridade, status e matéria opcionais.
- vinculos_acompanhamento: par único aluno/responsável, status pendente/autorizado/recusado/revogado e datas do ciclo atual.

Excluir matéria preserva tarefas com materia_id NULL. FKs RESTRICT dos vínculos impedem exclusões indiretas de participantes. CHECKs validam estados/datas; triggers validam perfis e impedem mudança de perfil de conta vinculada. Renovar após 24 horas reutiliza o par e exige nova aprovação. A linha guarda o ciclo mais recente, sem histórico completo de ciclos.

## Verificar sem gravar

GET /api/health/db executa SELECT 1. Confira estrutura pelo Workbench com SHOW CREATE TABLE e SHOW TRIGGERS. Não exporte backups, dados pessoais ou hashes para o repositório. O teste MySQL opcional requer banco separado; consulte [backend/README.md](../backend/README.md).
