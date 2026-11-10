# Revisão final — Entrega 3

Data: 10/11/2026. Branch entrega-3. Sem commit, push, troca de branch, alteração de .env, esquema ou registros MySQL. Alterações anteriores do workspace foram preservadas. Tema bordô, rosa e branco mantido.

## Problemas corrigidos nesta revisão

- Conversão de materia_id aceitava booleanos e arrays como IDs. Agora aceita somente número inteiro positivo ou string decimal, até 2147483647.
- Datas anteriores a 1000-01-01 passavam pela validação JavaScript apesar de incompatíveis com DATE MySQL; agora retornam 400. Teste cobre datas impossíveis, bissexto e limites.
- Corpo maior que 100 KB caía no erro interno 500; agora retorna 413 com mensagem explícita.
- Respostas privadas de CRUD não tinham a mesma proteção de cache do acompanhamento. Toda /api agora envia Cache-Control: no-store, inclusive erros de parsing.
- Mensagem de log do servidor tinha caracteres corrompidos.
- Auditoria do backend identificou duas vulnerabilidades moderadas em nodemon/minimatch. Fixado nodemon em 3.1.11, versão indicada pela auditoria, com lockfile atualizado; auditoria final zerada.
- READMEs do backend/banco ainda orientavam usuario_id, ausência de JWT e frontend pendente. Foram reescritos para o contrato atual.
- .gitignore ampliado para variantes de .env e formatos usuais de exportação local de banco. Arquivos importantes e legados foram mantidos.

## Funcionalidades revisadas

Cadastro e login único dos dois perfis; JWT e /me; rotas por perfil; CRUD isolado do aluno; calendário e datas; solicitação de acompanhamento; autorização, recusa e revogação; renovação após 24 horas; consulta autorizada somente leitura; resumo/progresso; logout e expiração.

Serviços enviam Bearer centralmente, não enviam usuario_id e usam os endpoints reais. Mutações recarregam as listas; retorno às telas do aluno recarrega resumo/matérias/tarefas. Acompanhamento atualiza ao retomar, manualmente e a cada 30 segundos em foco. Erros 401 limpam sessão; 403/404 descartam dados de acompanhamento; conflitos exigem decisão nova. Logout é local e não revoga um JWT já copiado.

## Resultados

| Verificação | Resultado |
| --- | --- |
| Frontend: npm test | 26 passaram |
| Backend: npm test | 33 passaram; 1 MySQL opt-in não executado |
| npm run lint | Aprovado |
| npm run typecheck | Aprovado; checkJs false, cobertura restrita aos contratos/layouts TypeScript |
| Expo Web export | Aprovado após atualização do lockfile |
| npm run test:web:perfis | Aprovado após compilação; Edge headless, 390px, API simulada e rede /api bloqueada |
| expo-doctor | 20/20 verificações aprovadas |
| expo install --check | Dependências compatíveis; repetido com acesso à rede |
| API real temporária | Health 200, MySQL SELECT 1 aprovado; recursos privados sem token 401; JSON inválido 400; corpo excessivo 413; no-store conferido |
| Auditoria backend | 0 vulnerabilidades |
| Auditoria frontend | Consulta atual: 10 moderadas, 0 altas/críticas; antes eram 11. Sem correção compatível publicada |
| git diff --check | Aprovado |

Os testes automatizados de funcionalidades usam HTTP/adaptador SQL em memória ou fetch simulado. O smoke de navegador não acessa o banco real. A API real foi iniciada temporariamente e encerrada após as verificações de leitura/negação; não foi deixado servidor novo em execução.

A auditoria frontend aponta glob/minimatch e cadeias de ferramentas Expo/TypeScript ESLint. O npm sugere expo@52.0.49 com --force, incompatível com o SDK 58 atual; essa sugestão não foi aplicada. Resolver com atualização compatível e nova validação antes de declarar a segurança sem pendências. Node também emite aviso de detecção automática de módulos nos testes JS; não houve falha.

## Arquivos alterados por esta revisão

- .gitignore
- backend/server.js
- backend/src/controllers/tarefasController.js
- backend/test/ownership.test.js
- backend/package.json
- backend/package-lock.json
- package-lock.json (tentativa de atualização compatível pela auditoria)
- README.md
- backend/README.md
- database/README.md
- docs/ENTREGA_3_FRONTEND.md
- docs/REVISAO_FINAL_ENTREGA_3.md (este relatório)

A lista de git status é maior porque já havia alterações e arquivos novos antes desta revisão. database/organiza_ai.sql e migrations já estavam alterados/novos; não foram modificados ou executados por esta revisão.

## Arquivos locais e segurança

backend/.env e .env.local estão ignorados e não aparecem entre arquivos rastreados; a consulta ao histórico local disponível desses caminhos não retornou commits. O exemplo backend/.env.example contém somente campos/placeholder. Não foram encontrados INSERTs com dados de teste nos scripts SQL. Builds e node_modules ficam ignorados.

src/services/mockData.js contém fixtures antigas sem uso no app atual; src/config/testUser.js e src/navigation/AppNavigator.js são arquivos legados aposentados. Foram mantidos para evitar remoção desnecessária. Fixtures dos testes são necessárias e não são credenciais de produção. A conta sintética registrada na documentação anterior foi preservada; nenhuma conta foi excluída.

O JWT_SECRET foi exposto no contexto enviado à conversa. Substitua-o localmente antes de publicação/uso com contas reais sensíveis; esta revisão respeitou a restrição e não modificou o .env. A troca invalida tokens existentes. Não copie o valor para documentação ou Git.

Esta inspeção não equivale a auditoria completa de todo histórico remoto ou pentest.

## Pendências manuais e decisão de entrega

Os fluxos principais foram confirmados manualmente pelo usuário (ver seção abaixo). O código pode ser preparado para commit/push com os alertas documentados; a troca local do segredo exposto continua pendente. Os cenários complementares abaixo não foram todos confirmados:

1. Duas sessões independentes, contas controladas de aluno e responsável: cadastro, login, dados e URLs do perfil oposto.
2. CRUD completo e resumo/progresso com MySQL real; calendário em virada de mês/ano, fevereiro bissexto, datas opcionais e fuso do celular.
3. Solicitar, autorizar, consultar somente leitura, recusar e revogar, comparando dados entre as contas; terceiro sem autorização não acessa.
4. Renovação depois de 24 horas, nova aprovação obrigatória e decisão antiga rejeitada.
5. Logout durante carregamento, troca de contas, voltar no histórico, recarregar, expiração de 15 minutos, API indisponível e retorno do background.
6. Android/iOS físicos: acesso por IP de rede, teclado, acessibilidade, rolagem e confirmação nativa.
7. Resolver/registrar formalmente os alertas moderados das ferramentas e substituir o segredo exposto antes da publicação.

Roteiro detalhado: [frontend da Entrega 3](ENTREGA_3_FRONTEND.md). Nenhuma publicação, commit ou push foi realizado.

## Testes manuais confirmados pelo usuário — 10/11/2026

Os resultados abaixo foram informados pelo usuário, não executados novamente pelo agente:

- Login do aluno: aprovado.
- Tarefas e matérias existentes: preservadas.
- Cadastro e login do responsável: aprovados.
- Solicitação de acompanhamento: aprovada.
- Autorização pelo aluno: aprovada.
- Revogação: aprovada.
- Após revogar, responsável não acessa os dados do aluno: aprovado.

Esses resultados validam os fluxos informados; não comprovam automaticamente CRUD completo, calendário, recusa, renovação após 24 horas, isolamento com terceiro, expiração ou testes em Android/iOS. Esses cenários continuam como verificações complementares.

## Fechamento e decisão de envio

Verificações repetidas: 26 testes frontend, 33 backend (1 MySQL opt-in não executado), lint, typecheck, Web, smoke e Expo Doctor 20/20 aprovados. Backend sem vulnerabilidades; frontend com 10 alertas moderados na consulta atual, originados em dois avisos de ferramentas. Não existe atualização compatível publicada nas linhas consumidas. Nenhum --force ou override principal foi usado.

Código/documentação tecnicamente prontos para commit e push da Entrega 3, com riscos de ferramentas registrados. Antes do envio final recomendado, substitua localmente o JWT_SECRET exposto e reinicie a API; essa ação do usuário ainda não foi confirmada. Testes complementares não devem ser apresentados como concluídos. Não há credenciais/backups entre os arquivos candidatos inspecionados.

Arquivos alterados neste fechamento: .gitignore, README.md, docs/ENTREGA_3_FRONTEND.md, docs/REVISAO_FINAL_ENTREGA_3.md, novo docs/SEGURANCA_ENTREGA_3.md e database/VALIDACAO_ETAPA_4_1.md (remoção de caminho pessoal). Manifestos e lockfiles foram preservados nesta rodada. Nenhuma tela ou funcionalidade foi alterada.

Consulte [a análise de segurança](SEGURANCA_ENTREGA_3.md) para versões, impacto, recomendações e troca segura local do segredo. Sem commit/push ou operações no banco.