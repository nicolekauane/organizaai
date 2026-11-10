# Validacao da migracao 4.1

> Estado atual em 09/11/2026: migracao aplicada e validada no banco principal com autorizacao expressa, apos NOVO backup restaurado com sucesso. Os resultados iniciais abaixo sao historicos; consulte a secao de aplicacao real ao final.

Data: 09/11/2026 (America/Sao_Paulo). Branch: entrega-3. MySQL Server e clientes: 8.0.46.

## Resultado

Backup completo criado e validado por restauracao real. Migracao aprovada no banco de testes. Banco principal preservado: todas as tabelas, registros e definicoes foram comparados antes/depois, sem divergencias. Nenhuma migracao foi aplicada ao principal. Nenhum .env foi modificado. Sem commit ou push.

## Artefatos privados (fora do Git)

- Pasta: %LOCALAPPDATA%/OrganizaAiBackups/validacao_4_1_9de56fb8d5de4072983df8d972c975da
- Backup: backup_completo.sql (5941 bytes).
- SHA-256: db185fc19a45f544b33cef589a5995d6183d0b2efc65d589a1e4f9e60a2555ad
- Relatorio detalhado: resultado.json.
- Script utilizado: validar.cjs (sem credenciais embutidas; nao reexecutar sem revisar, pois gera outro backup/banco).
- ACL da pasta: heranca desativada; acesso permitido somente a conta Windows atual. O SQL contem dados e hashes e nao deve ser compartilhado ou adicionado ao Git.

O dump incluiu estrutura, dados, triggers, routines e events, com single-transaction/quick/hex-blob, sem selecionar ou criar banco e sem transportar GTIDs. O banco original continha apenas tabelas InnoDB e nenhum objeto armazenado (triggers/routines/events/views). Arquivo nao vazio, termino bem-sucedido do mysqldump, marcador de conclusao e SHA-256 foram verificados; o hash foi conferido novamente apos os testes. Credenciais foram lidas localmente, nao impressas nem passadas como argumentos de senha; apenas o subprocesso recebeu a senha por ambiente.

## Restauracao e migracao

Banco criado: organiza_ai_teste_41_1bcad9b4f85d0112. Nome aleatorio distinto do principal, com verificacao previa de inexistencia; nenhum banco anterior foi substituido/apagado. Charset e collation copiados do principal. O backup foi restaurado pelo cliente mysql sem --force. Contagens, SHA-256 do conteudo integral de cada tabela e SHA-256 de SHOW CREATE TABLE coincidiram com a origem antes da migracao.

Executado exclusivamente database/migrations/001_vinculos_acompanhamento.sql, com o banco de testes selecionado explicitamente. SHA-256 do script validado: 425f21a951c442963c811175f39e238a2a7d71fbfdee7da1df2891676ddf849b. O script completo organiza_ai.sql nao foi executado.

Verificacoes de metadados: nova tabela vazia; duas FKs para usuarios(id); PRIMARY e uq_vinculo_par; indices aluno/status e responsavel/status; quatro CHECKs; tres triggers; compatibilidade dos perfis aluno/responsavel.

## Testes de integridade no MySQL real de testes

- Insercao pendente e atualizacoes com os quatro status permitidos.
- Rejeicao de par duplicado, perfis invertidos, autovinculo e participantes inexistentes.
- Rejeicao de status invalido/vazio, datas ausentes/incompativeis e cronologia invalida.
- Rejeicao de update do vinculo com perfil incorreto.
- Rejeicao de troca de perfil de ambos os participantes vinculados.
- Rejeicao de exclusao de ambos os participantes vinculados pelas FKs.
- Atualizacao de nome permitida para usuario vinculado.
- Fixtures criadas somente no banco de testes, dentro de transacao revertida ao final.

Todos passaram. Antes das fixtures, estrutura e dados de usuarios, materias e tarefas eram identicos ao original apos a migracao. Depois do rollback, todos os dados originais continuaram identicos e vinculos_acompanhamento ficou vazia. Inserts revertidos podem avancar AUTO_INCREMENT apenas no banco de testes. O banco de testes foi mantido para inspecao.

## Verificacoes do projeto

12 testes automatizados do backend passaram. Lint e typecheck executados com sucesso. Nenhum codigo de funcionalidade ou script SQL foi alterado nesta validacao.

## Procedimento anterior a autorizacao (historico)

Estamos prontos tecnicamente para aplicar a migracao validada, aguardando autorizacao explicita. Antes disso: confirmar destino e ausencia da tabela/triggers, impedir mudancas concorrentes de esquema, gerar e verificar backup atualizado e conferir que o SHA-256 do incremental continua igual ao registrado. Executar somente o incremental no banco principal explicitamente selecionado, sem --force. Conferir metadados e preservacao dos dados e reiniciar a API para carregar o middleware se necessario.

DDL faz commits implicitos: se houver erro, parar e inspecionar o estado parcial, sem apagar objetos/dados ou repetir o script automaticamente. Este backup foi validado neste momento e nao inclui futuras alteracoes do aplicativo.

Referencias: [mysqldump](https://dev.mysql.com/doc/refman/8.0/en/mysqldump.html) e [CHECK constraints](https://dev.mysql.com/doc/refman/8.0/en/create-table-check-constraints.html).


## Aplicacao real autorizada - 09/11/2026

Branch confirmada: entrega-3. Banco principal confirmado pela configuracao local do backend: organiza_ai. A tabela vinculos_acompanhamento estava ausente. Script aplicado uma unica vez: database/migrations/001_vinculos_acompanhamento.sql. Sua identidade foi comparada com o checksum da validacao anterior antes do procedimento e imediatamente antes da aplicacao. Nenhum DROP, TRUNCATE, ALTER ou comando de modificacao de registros foi encontrado entre as instrucoes executaveis do incremental. O script completo organiza_ai.sql nao foi utilizado.

### Novo backup e restauracao obrigatorios

Novo backup completo criado com estrutura, dados, routines, triggers e events. Caminho privado: %LOCALAPPDATA%/OrganizaAiBackups/aplicacao_4_1_345ff68bda024216a9fbb6e840b05e19/backup_completo.sql. Tamanho: 5941 bytes. Pasta com heranca ACL desativada e permissao para a conta Windows atual. O arquivo anterior foi mantido e sua existencia conferida; o novo backup tambem foi preservado. Nenhuma senha, token ou hash de usuario foi incluido neste relatorio.

Foram verificados sucesso do mysqldump, arquivo nao vazio, marcador de conclusao e checksum do arquivo; o checksum foi conferido novamente ao final e esta registrado somente no relatorio privado resultado.json. O dump foi restaurado integralmente no novo banco organiza_ai_teste_41_5b87200ca2d77b33, cujo nome e inexistencia foram verificados antes da criacao. Nenhum banco preexistente foi apagado ou substituido. Contagens, conteudo integral e definicoes das tabelas restauradas coincidiram com o banco principal. Charset/collation foram preservados.

Antes de qualquer escrita no principal, sua estrutura foi comparada com o ambiente previamente validado, sem diferencas inesperadas. A migracao foi novamente aplicada na nova copia restaurada e os testes de integridade passaram: estados permitidos, rejeicao de duplicidade/perfis invalidos/participantes inexistentes/datas inconsistentes, validacao em updates, bloqueio de exclusao e de mudanca de perfil dos participantes vinculados. Login real com fixture, JWT, /me e autorizacao de aluno/responsavel foram verificados por HTTP na copia. As fixtures foram revertidas por rollback; o banco temporario foi mantido.

### Resultado no principal

Somente apos todas essas verificacoes, foi executado o incremental aprovado no banco organiza_ai, explicitamente selecionado. A tabela vinculos_acompanhamento foi criada e permaneceu vazia. Sua definicao coincide com a copia validada: colunas e ENUM dos quatro status, duas FKs para usuarios(id), PRIMARY, unicidade do par, indices por participante/status e quatro CHECKs. Os tres triggers tambem coincidem com a copia validada. Os perfis existentes sao compativeis com usuarios.tipo_usuario.

Usuarios, materias e tarefas: contagens, conteudo integral e SHOW CREATE TABLE permaneceram identicos ao novo backup, tanto imediatamente depois da aplicacao quanto apos as verificacoes HTTP. Nao foram inseridos, editados ou excluidos registros do principal. O unico objeto acrescentado sobre tabela anterior foi o trigger previsto pela migracao em usuarios.

JWT e /api/auth/me foram verificados por HTTP com identidade de aluno existente e conexao somente leitura no principal. GET de materias e tarefas para aluno retornou 200; sem token retornou 401. Login com senha e bloqueio de responsavel foram confirmados na copia restaurada e nos testes automatizados, sem criar contas ou trocar senhas reais. As verificacoes HTTP usaram instancia Express temporaria com os routers atuais; nao comprovam que outro processo de API ja aberto foi reiniciado.

### Ocorrencias e resolucao

A primeira comparacao pos-aplicacao interrompeu a verificacao devido ao contador AUTO_INCREMENT da tabela de vinculos no banco de testes: inserts revertidos por rollback avancaram esse contador. O comparador privado substituia o numero por um marcador, mas a tabela principal vazia nao apresentava esse atributo. Uma leitura independente confirmou que as definicoes eram identicas ao remover inteiramente apenas o contador. A verificacao foi retomada com essa normalizacao corrigida, sem reaplicar migracao nem executar correcao no banco. As comparacoes das tabelas originais continuaram exatas, incluindo seus contadores. Houve ainda um erro de sintaxe no script privado de verificacao; corrigido antes de sua execucao, sem efeito no banco.

### Verificacoes finais e pendencias

- Backend: 12 testes passaram.
- Frontend: 10 testes passaram; aviso preexistente de modulo ESM do Node, sem falha.
- Lint e typecheck: passaram.
- Backup novo: integridade conferida novamente e restauracao comprovada.
- Aplicacao real: concluida e validada. Nao reaplicar o incremental.
- Nenhum .env, frontend ou codigo de funcionalidade foi alterado. Sem commit ou push.
- Nenhuma pendencia na migracao. Se a API estiver rodando codigo antigo, reiniciar pelo procedimento normal de desenvolvimento; nenhum processo existente foi reiniciado nesta execucao.
