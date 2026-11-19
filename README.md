# Organiza Aí

## Entrega 4 — finalização Android

Estado atual: o APK do perfil apk-local foi gerado com sucesso, conforme confirmação do usuário: [build Android](https://expo.dev/accounts/nicolemueller/projects/organiza-ai/builds/ba269caf-9115-49da-a5b3-c15d13ce8879). A instalação e os testes físicos permanecem pendentes. A variável EXPO_PUBLIC_API_URL foi configurada pelo usuário no ambiente EAS preview como http://172.20.135.67:3000.

Tecnologias: React Native 0.88.1, React 19.3, Expo SDK 58, Expo Router, JavaScript/TypeScript, Node.js/Express 5, MySQL >= 8.0.16, JWT, scrypt, ESLint e EAS Build. Funcionalidades: cadastro/login de Aluno e Responsável, CRUD de tarefas/matérias do Aluno, resumo/progresso e solicitação, autorização, recusa e revogação de acompanhamento somente leitura.

Para executar com o ambiente existente: `npm --prefix backend start` em um terminal; na raiz, configure `EXPO_PUBLIC_API_URL` no terminal com a origem real da API e execute `npm start` ou `npm run web`. Instalação nova de dependências usa `npm ci` na raiz e no backend. Configure um banco novo conforme [database/README.md](database/README.md); no banco existente, não reimporte SQL nem reaplique migrações. Preserve backend/.env e JWT_SECRET; o banco não é acessado diretamente pelo celular.

O APK local depende de computador/API/MySQL ligados, IP correto e mesma rede Wi-Fi; localhost no celular não aponta para o computador. HTTP é permitido apenas no perfil de avaliação apk-local; o perfil apk exige HTTPS. A URL é incorporada no build. Abra `/api/health` no navegador do Android para validar a rede. A sessão JWT continua em memória e exige login após reiniciar o app.

- [Guia da Entrega 4: execução, banco, API, EAS, geração/instalação e testes](docs/ENTREGA_4_APK.md).
- [Roteiro curto de apresentação para a escola](docs/APRESENTACAO_ENTREGA_4.md).
- [Checklist final e registro das evidências do APK](docs/CHECKLIST_ENTREGA_4.md).

Verificação final: 27 testes frontend e 33 backend aprovados; 1 MySQL opt-in desativado; lint, typecheck e compilação Web aprovados. A API e a conexão MySQL responderam aos endpoints de saúde; os fluxos completos com API e banco reais não foram confirmados. O smoke Web passou com API simulada e exportação anterior (390 px). Expo Doctor: 19/20, recomendando expo ~58.0.26 e expo-router ~58.0.32. Pendentes: instalação, conectividade e fluxos no Android e ensaio. A instalação anterior reportou 8 alertas moderados de dependências; não foi aplicada correção forçada.

A branch de trabalho é entrega-3, publicada no GitHub. Esta atualização é restrita à documentação e preserva .env, JWT_SECRET, banco e configurações do EAS. As seções abaixo conservam o histórico da Entrega 3; o estado atual do APK é o registrado acima.

Aplicativo de organização escolar com React Native, Expo SDK 58 e Expo Router para Android, iOS e Web. API Node.js/Express com MySQL.

## Entrega 3 - autenticação integrada

O aplicativo permite cadastrar Aluno ou Responsável, entrar por um único login e sair pelo botão **Sair**. Alunos mantêm suas telas de organização; responsáveis acessam somente o acompanhamento autorizado. Veja [o frontend dos perfis](docs/ENTREGA_3_FRONTEND.md).

As funcionalidades da Entrega 2 foram mantidas:

- CRUD de matérias com professor opcional, paleta e cor personalizada;
- CRUD de tarefas com descrição, data e matéria opcionais, prioridade e status;
- conclusão e reabertura de tarefas;
- totais e até três próximas atividades no Início;
- progresso das matérias calculado pelas tarefas concluídas;
- carregamento, mensagens de erro e estados vazios.

## Executar localmente

1. Tenha Node.js, npm e MySQL disponíveis.
2. Para instalação nova, crie `organiza_ai` e importe `database/organiza_ai.sql`. **Não reimporte o script em um banco existente.** A migração da etapa 4.1 já foi aplicada ao banco principal deste ambiente. Não a reaplique; consulte database/README.md para outros ambientes.
3. Execute `npm ci` dentro de `backend`, configure `backend/.env` a partir do exemplo (sem sobrescrever um ambiente existente), incluindo conexão MySQL e `JWT_SECRET` privado. Veja [backend/README.md](backend/README.md).
4. Inicie a API com `npm start` dentro de `backend`. Confira `/api/health` e `/api/health/db`.
5. Na raiz, execute `npm ci` e `npm run web`. Para desenvolvimento móvel, use `npm start`.
6. Abra o aplicativo, crie sua conta, volte ao login e entre.

A API usa `http://localhost:3000` por padrão. Opcionalmente configure `EXPO_PUBLIC_API_URL` no ambiente local do frontend e reinicie o Expo. Para aparelho físico, use o IP de rede do computador que executa a API, acessível pelo dispositivo. Em produção, use HTTPS.

`EXPO_PUBLIC_TEST_USER_ID` foi aposentado e não é lido pelo aplicativo; não precisa ser configurado. Nenhum arquivo `.env` existente foi alterado pela integração.

## Navegação

As rotas ficam em `src/app/`; as telas e componentes reutilizáveis permanecem fora dessa pasta.

| Rota | Acesso |
| --- | --- |
| `/login` | Público, sem sessão autenticada |
| `/cadastro` | Público, cria Aluno ou Responsável |
| `/` | Aluno, Início |
| `/tarefas` | Aluno |
| `/materias` | Aluno |
| `/responsaveis` | Aluno: solicitações e controle de vínculos |
| `/acompanhamento` | Responsável: alunos e solicitações |
| `/acompanhamento/:alunoId` | Responsável: detalhes autorizados, somente leitura |

Os layouts usam `Stack.Protected`: sem sessão, tentativas de abrir rotas privadas levam ao login. Ao sair, o grupo privado é desmontado e removido do histórico permitido. O controle definitivo de acesso continua no backend.

## Sessão e segurança

- O access token fica **somente em memória**, inclusive no Web. Não há AsyncStorage, localStorage, cookie de sessão ou refresh token.
- Após login, `/api/auth/me` confirma o usuário antes da abertura das telas privadas.
- O serviço central adiciona `Authorization: Bearer TOKEN` às requisições privadas. Cadastro e login não enviam Bearer.
- Expiração por tempo (15 minutos), retomada do aplicativo e respostas `401` encerram a sessão com mensagem amigável.
- Logout apaga token e usuário, desmonta as telas com seus dados e cancela/descarta requisições da sessão anterior. Respostas atrasadas não restauram dados nem encerram uma nova conta.
- Recarregar a página ou reiniciar o aplicativo exige novo login. Logout é local: um token copiado permanece válido no servidor até expirar; não há revogação imediata nesta etapa.
- `JWT_SECRET` pertence exclusivamente ao backend. Nunca coloque segredos em variáveis `EXPO_PUBLIC_*`.
- Propriedade dos dados é determinada pelo token no backend, sem confiar em `usuario_id` fornecido pelo cliente. Os serviços do aplicativo não enviam esse campo.

O `.gitignore` mantém arquivos de ambiente, `node_modules` e builds locais fora do Git. Não registre senhas ou tokens em logs.

## Uso

**Matérias:** `+ Nova matéria`, nome obrigatório, professor opcional, paleta e cor hexadecimal; seletor de cor adicional no Web. Cards permitem editar e excluir.

**Tarefas:** `+ Nova tarefa`, título obrigatório, descrição, calendário, prioridade, status e matéria opcional. Datas exibidas em `DD/MM/AAAA` e enviadas como `YYYY-MM-DD`. Cards permitem editar, excluir, concluir e reabrir.

**Início:** totais reais e até três atividades pendentes ordenadas por prazo. O progresso de cada matéria usa a proporção de tarefas concluídas. Excluir matéria mantém tarefas sem vínculo.

## Verificações automatizadas

Na raiz:

```sh
npm test
npm run lint
npm run typecheck
npx expo export --platform web
```

No backend: `npm test`.

Os testes do frontend usam serviços reais com `fetch` simulado e relógio controlado para sessão. Cobrem validação, cadastro, login, `/me`, falhas, expiração, logout e respostas atrasadas. Os testes do backend usam HTTP real com adaptador SQL em memória e cobrem isolamento entre contas. Nenhuma suíte modifica o MySQL real. Typecheck cobre layouts TypeScript e seus contratos; o código JavaScript legado continua sem checagem estrita (`checkJs: false`). O lint preserva a sincronização de mês do calendário legado com uma exceção localizada de regra.

## Roteiro manual no navegador

1. Acesse `/tarefas` sem login: deve abrir o login. Confira campos vazios, e-mail inválido, confirmação divergente e mostrar/ocultar senha.
2. Cadastre uma conta A. Confira sucesso, retorno ao login, senha incorreta e login correto.
3. Cadastre, edite e exclua matérias; confira paleta e cor personalizada.
4. Cadastre tarefas com e sem prazo/matéria; confira calendário, data, edição, conclusão e reabertura. Confira resumo e progresso.
5. Exclua uma matéria com tarefas: elas devem permanecer sem matéria.
6. Saia e entre em uma conta B: os dados de A não devem aparecer. Cadastre dados de B e volte à conta A para confirmar o isolamento.
7. Saia durante carregamento, tente voltar pelo histórico e recarregue uma rota privada: dados anteriores não devem reaparecer.
8. Aguarde os 15 minutos de validade: deve retornar ao login com aviso; novo login deve funcionar.
9. Teste API desligada, janela estreita, teclado e rolagem no celular. Esses testes visuais e a integração com MySQL real não são substituídos pelos testes automatizados.


## Frontend dos perfis - Entrega 3

Cadastro com Aluno selecionado por padrão e opção Responsável. O login confirma o perfil em /api/auth/me. Expo Router protege os grupos por perfil; permissões e vínculo continuam sendo validados pelo backend em todas as consultas.

O aluno acessa **Responsáveis** pelo cabeçalho. Pode autorizar/recusar pendências e revogar acesso com confirmação. As decisões enviam solicitado_em sem conversão. Conflitos 409/503 atualizam a lista e exigem nova decisão, sem retry automático.

O responsável pode solicitar acompanhamento por e-mail, recebe a mensagem genérica da API e visualiza seus vínculos e alunos autorizados. Detalhes mostram matérias, tarefas, descrições, contagens e progresso, sem handlers de escrita. Renovar vínculo exige reenviar o e-mail após o cooldown de 24 horas, sempre com nova aprovação do aluno.

Dados de acompanhamento ficam apenas em memória, são descartados ao perder foco, ir ao background, sair, expirar ou perder acesso (401/403/404). No retorno e a cada 30 segundos enquanto a tela está ativa, uma nova consulta confirma o acesso. Sem push do servidor, a revogação na outra conta é percebida na próxima consulta; nenhum cache persistente foi adicionado.

Validação desta etapa: 26 testes do frontend, 33 testes do backend (o teste MySQL opt-in ficou desabilitado), lint, typecheck, exportação Web e smoke de navegador com API simulada aprovados. Para repetir o smoke, após exportar o Web, execute npm run test:web:perfis. Requer Edge headless; pode usar ORGANIZA_AI_BROWSER para indicar outro executável Chromium. Não acessa a API real: intercepta respostas e bloqueia chamadas de rede a /api.

Roteiro manual, relação de arquivos e ocorrência de teste: [docs/ENTREGA_3_FRONTEND.md](docs/ENTREGA_3_FRONTEND.md).

## Revisão final da Entrega 3 — 10/11/2026

Consulte [o relatório final](docs/REVISAO_FINAL_ENTREGA_3.md) para correções, arquivos desta revisão, resultados e pendências. Frontend: 26 testes; backend: 33 aprovados e 1 MySQL opt-in não executado; lint, typecheck, Web, smoke e Expo Doctor aprovados. Auditoria backend zerada; frontend apresenta 10 alertas moderados em ferramentas na consulta atual (11 na revisão anterior). Os fluxos principais já foram confirmados manualmente pelo usuário; consulte os resultados abaixo e as verificações complementares ainda pendentes.

A revisão não alterou .env, esquema ou registros do banco, não trocou a branch e não fez commit/push. O segredo JWT exposto no contexto da conversa deve ser substituído localmente antes da publicação.
## Fechamento com testes manuais confirmados

Usuário confirmou login do aluno, preservação das tarefas/matérias, cadastro/login do responsável, solicitação, autorização, revogação e bloqueio de acesso após revogar. Esses resultados foram registrados em [Entrega 3](docs/ENTREGA_3_FRONTEND.md).

Testes repetidos: frontend 26 aprovados; backend 33 aprovados e 1 MySQL opt-in não executado; lint, typecheck, compilação Web, smoke e Expo Doctor 20/20 aprovados. [Análise dos alertas e segurança](docs/SEGURANCA_ENTREGA_3.md): backend zerado; frontend com 10 moderados na consulta atual, sem correção compatível publicada para as duas dependências de origem. Não foi aplicado --force.

Código e documentação preparados para commit/push com os riscos registrados. Substitua localmente o segredo exposto antes do envio final recomendado. Expiração, recusa, renovação após 24 horas, CRUD completo/calendário e dispositivos físicos continuam como testes complementares não confirmados. Nenhum commit/push ou alteração de .env/banco foi realizado neste fechamento.
## Entrega 4 — preparação do APK Android

Consulte [o guia de APK](docs/ENTREGA_4_APK.md) para URL da API, perfis, instalação e roteiro de avaliação. O build apk-local foi gerado com sucesso; registre o teste físico no checklist quando realizado. Builds rejeitam localhost e URL ausente.
