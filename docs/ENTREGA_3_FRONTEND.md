# Entrega 3 - frontend Aluno e Responsável

Branch: entrega-3. Tema bordô, rosa e branco preservado. Não há dependências novas, alteração de esquema, alteração de .env, exclusão de dados, commit ou push nesta implementação.

## Telas

- Cadastro: rádio Aluno/Responsável, aluno padrão, explicação de consentimento, validações existentes preservadas; envia tipo_usuario para o contrato real.
- Login: único para os dois perfis; /api/auth/me confirma o perfil antes da liberação das rotas. Perfil desconhecido falha com sessão limpa.
- Aluno: Início, Tarefas e Matérias preservados. Cabeçalho com Responsáveis, que lista pendências, autorizados e encerrados. Autorizar/Recusar usam a versão exibida; Revogar confirma com Cancelar/Revogar.
- Responsável: /acompanhamento, formulário de e-mail, resposta genérica da API, lista autorizada e histórico de vínculos/status. Não é mostrado um botão de autorização para responsáveis.
- Detalhe: /acompanhamento/:alunoId, com nome obtido da lista autorizada, matérias, tarefas, descrições e resumo real. Cards existentes reutilizados sem callbacks de edição, exclusão, conclusão ou reabertura.

## Integração e proteção

Os serviços usam exclusivamente os endpoints de vínculos/acompanhamento existentes, Bearer JWT, cache no-store e nenhum usuario_id do cliente. solicitado_em é uma versão opaca enviada exatamente como recebida; 409/503 provocam atualização da lista e nova decisão explícita. Renovação exige formulário com e-mail e cooldown de 24 horas imposto pelo backend; nunca há autorização automática.

Dados privados são temporários e limitados à tela em foco. Cada carregamento publica o conjunto completo ou nenhum detalhe. Perda de foco, background, logout e expiração eliminam os dados. Gerações de requisição impedem que respostas atrasadas preencham outra tela ou conta. Um 404 apaga todos os recursos de acompanhamento ativos; 403 também encerra a sessão para reconfirmar o perfil; 401 usa a limpeza central existente. Falhas de rede também removem o conteúdo antigo. Não há armazenamento persistente de alunos, tarefas ou vínculos.

Ao voltar à tela ou ao foreground, os dados são consultados novamente. Há atualização manual e a cada 30 segundos em foco/foreground. Sem canal push no backend, uma revogação externa será percebida na consulta seguinte. A proteção definitiva é a verificação de autorização feita pelo backend em cada request. Recarregar o navegador exige login, como antes.

## Arquivos desta etapa

Criados:

- src/auth/profiles.js
- src/auth/privateResource.js
- src/services/acompanhamentoService.js
- src/hooks/usePrivateResource.js
- src/hooks/usePrivateAction.js
- src/components/FollowUI.js
- src/screens/ResponsaveisScreen.js
- src/screens/GuardianScreen.js
- src/screens/FollowStudentScreen.js
- src/app/(private)/responsaveis.js
- src/app/acompanhamento/_layout.tsx
- src/app/acompanhamento/index.js
- src/app/acompanhamento/[alunoId].js
- tests/acompanhamento.test.mjs
- scripts/smoke-perfis-web.cjs
- docs/ENTREGA_3_FRONTEND.md

Alterados:

- src/components/AuthForm.js
- src/services/authService.js
- src/utils/authValidation.js
- src/utils/confirmAction.js (rótulo configurável, mantendo Excluir como padrão)
- src/auth/session.js e src/context/AuthContext.js (tipagem do usuário/contexto)
- src/app/_layout.tsx e src/app/(private)/_layout.tsx
- tests/auth.test.mjs
- package.json (comando do smoke, sem dependências)
- README.md e backend/README.md (documentação)

## Verificações executadas

- npm test na raiz: 26 testes passaram, incluindo ambos os cadastros, confirmação de perfil pelo /me, payloads reais, isolamento, leitura autorizada, revogação/404, 403/401, logout, expiração e respostas atrasadas. A regressão dos serviços CRUD do aluno continua passando.
- npm test no backend: 33 passaram; 1 teste MySQL opt-in não executado nesta etapa.
- npm run lint e npm run typecheck: aprovados.
- npm exec -- expo export --platform web: aprovado, gera dist fora do Git.
- Smoke headless da aplicação compilada em 390px: cadastro com perfil padrão e seleção de responsável; login/redirecionamento dos dois perfis; solicitação genérica; autorização; recusa; cancelamento e confirmação de revogação; detalhes sem botões de escrita; descarte após 404 e ausência de overflow horizontal na tela de detalhes. A API do smoke aprovado foi simulada e as chamadas de rede /api foram bloqueadas via CDP.

O teste de navegador encontrou e permitiu corrigir uma rota inicial sem índice na área do responsável e o estado ARIA do seletor de perfil no React Native Web. A área agora tem índice explícito em src/app/acompanhamento.

## Ocorrência da tentativa inicial de smoke

Antes de o isolamento do navegador ser corrigido, a tentativa inicial usou a API configurada e criou uma conta sintética de responsável com e-mail teste@example.com. A existência e a correspondência com a fixture foram verificadas por leitura. A conta foi mantida, sem exclusão; nenhuma senha/token/hash é registrado aqui. Nenhum usuário anterior, matéria, tarefa ou vínculo foi editado/excluído por essa tentativa. As execuções seguintes usaram bloqueio de rede para /api antes de carregar a aplicação e fixtures validadas sintaticamente. O script salvo inclui essas proteções.

## Roteiro com contas reais (parcialmente validado pelo usuário)

1. Reinicie o backend para carregar as rotas de acompanhamento já implementadas. Use duas sessões de navegador independentes e contas controladas de aluno e responsável. Não use a conta sintética como conta pessoal.
2. Cadastre os dois perfis, confira aluno padrão, validações e retorno ao login. Entre: aluno deve ir ao Início; responsável, a Alunos acompanhados. Teste URLs do perfil oposto e deep links sem sessão, incluindo histórico após logout.
3. No aluno, valide toda a regressão: criar/editar matérias e tarefas com campos opcionais, concluir/reabrir, resumo/progresso e exclusão controlada apenas de dados criados manualmente para o teste, se desejado. Nenhum teste automatizado desta etapa exclui registros reais.
4. No responsável, envie e-mail de aluno controlado, inexistente e duplicado: confirmação deve continuar genérica. Confira pendentes e limites 429 sem insistir no backend em uso.
5. No aluno, confira o nome do solicitante e autorize. Atualize a área do responsável e abra os detalhes. Confira campos, descrições, datas, contagens e progresso contra a conta do aluno; nenhum botão de escrita deve existir.
6. Com outro responsável/aluno, confirme que dados alheios não aparecem. Tente URL com ID inacessível: nenhum detalhe deve ser mostrado.
7. Recuse outra solicitação. Revogue uma autorização, primeiro cancelando e depois confirmando. No responsável, atualize/retome a tela e confirme o descarte dos dados e o erro de acesso. Uma solicitação renovada após 24 horas precisa de nova aprovação; telas antigas não podem aprovar a nova versão.
8. Saia durante carregamento, alterne contas, volte no histórico e deixe o token expirar por 15 minutos. Nenhum dado anterior deve reaparecer. Teste API desligada e retomada após background.
9. Teste Android/iOS físicos: teclado, leitura por acessibilidade, confirmação nativa Cancelar/Revogar, rolagem e largura estreita. O smoke Web não substitui essa validação nem uma sessão completa de acompanhamento com MySQL real.

Referências consultadas: [Expo SDK 58](https://docs.expo.dev/versions/v58.0.0/), [Router SDK 58](https://docs.expo.dev/versions/v58.0.0/sdk/router/) e [Protected routes](https://docs.expo.dev/router/advanced/protected/).

## Revisão final de 10/11/2026

A revisão geral e seus resultados atuais estão em [REVISAO_FINAL_ENTREGA_3.md](REVISAO_FINAL_ENTREGA_3.md). O roteiro com contas reais acima foi parcialmente validado pelo usuário; consulte os resultados confirmados abaixo. Esta revisão acrescentou validação de IDs/datas, proteção de cache em toda a API, resposta 413, correção da dependência de desenvolvimento do backend e atualização da documentação; nenhum visual foi alterado. As afirmações históricas anteriores sobre ausência de dependências novas descrevem a etapa original, não o ajuste final de nodemon.
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

Análise dos alertas, instruções de troca local do JWT e preparação do Git: [SEGURANCA_ENTREGA_3.md](SEGURANCA_ENTREGA_3.md).