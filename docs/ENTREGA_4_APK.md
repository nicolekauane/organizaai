# Entrega 4 — APK Android

## Estado atual

Projeto Expo `@nicolemueller/organiza-ai`, vinculado pelo usuário com `eas init`. O app.json contém owner `nicolemueller`, projectId `30959e81-fead-4f38-a92d-3890feaf0efd`, package Android `br.com.organizaai.app`, versão 1.0.0 e versionCode 1.

Segundo o usuário, o [build apk-local](https://expo.dev/accounts/nicolemueller/projects/organiza-ai/builds/ba269caf-9115-49da-a5b3-c15d13ce8879) gerou o APK com sucesso e a variável EXPO_PUBLIC_API_URL do ambiente remoto preview é http://172.20.135.67:3000. A variável remota não foi consultada nesta revisão. Instalação e testes no Android permanecem pendentes; alterações de documentação não entram no APK já gerado.

## Tecnologias, funcionalidades e organização

Frontend: React Native 0.88.1, React 19.3, Expo SDK 58, Expo Router, JavaScript e layouts TypeScript. Backend: Node.js, Express 5, JWT HS256, scrypt, express-rate-limit e mysql2/promise. Banco: MySQL >= 8.0.16, InnoDB, chaves estrangeiras, CHECKs e triggers. Ferramentas: npm, ESLint, TypeScript, node:test, Expo Doctor e EAS Build.

- Aluno: cadastro/login, resumo, CRUD de matérias e tarefas, prazo, prioridade, status, conclusão/reabertura e progresso; controla solicitações de responsáveis.
- Responsável: cadastro/login, solicitação por e-mail e acompanhamento somente leitura de alunos autorizados.
- Consentimento: aluno autoriza, recusa ou revoga; renovação de vínculo encerrado exige 24 horas e nova aprovação.
- Sessão: JWT somente em memória, expira em 15 minutos, logout e novo login após reiniciar o aplicativo. Sem refresh token, modo offline ou notificações push.

Rotas ficam em src/app, telas em src/screens, componentes em src/components, serviços em src/services, sessão/perfis em src/auth. O backend separa rotas, middleware, controladores e serviços em backend/src. Os arquivos legados de mock/testUser não são importados pelos fluxos ativos; não foram removidos. Expo Router permanece como navegação principal.

## Executar frontend, backend e banco

Requisitos: Node.js/npm, dependências instaladas e MySQL já configurado. Para uma instalação nova de dependências:

```powershell
npm ci
npm --prefix backend ci
```

Não é preciso reinstalar se o ambiente atual já estiver funcionando. Em banco existente, não reimporte database/organiza_ai.sql nem reaplique migrações. Somente em instalação nova e separada, siga [database/README.md](../database/README.md) para criar organiza_ai e importar a estrutura com cliente que suporte DELIMITER. As tabelas principais são usuarios, materias, tarefas e vinculos_acompanhamento.

A API usa as variáveis PORT, DB_HOST, DB_PORT, DB_USER, DB_PASSWORD, DB_NAME, DB_CONNECTION_LIMIT e JWT_SECRET do backend/.env existente. Não altere esse arquivo ou o JWT_SECRET nesta entrega; não copie seus valores para documentação, frontend ou Git. Orientações para ambiente novo: [backend/README.md](../backend/README.md).

Terminal 1, raiz do projeto:

```powershell
npm --prefix backend start
```

Terminal 2, raiz, depois de conferir o IP do computador:

```powershell
Get-NetIPConfiguration
$env:EXPO_PUBLIC_API_URL = 'http://172.20.135.67:3000'
npm start
# Alternativa para o navegador:
# npm run web
```

O backend já escuta sem restringir a interface a localhost. A porta padrão é 3000, salvo configuração existente. /api/health verifica a API e /api/health/db faz SELECT 1. A conexão real foi confirmada por SELECT 1; não foram executados migração, escrita ou testes completos dos fluxos com o MySQL real.

## URL da API e limites do Android local

src/services/api.js lê diretamente process.env.EXPO_PUBLIC_API_URL, com trim e remoção da barra final. Os serviços acrescentam `/api/...`; a variável deve conter só a origem, sem `/api`, query, fragmento ou credenciais. Expo incorpora a variável durante a compilação; ela não é um segredo. Nunca coloque JWT_SECRET, senha do banco ou token em EXPO_PUBLIC_*.

O fallback localhost serve ao desenvolvimento local no navegador. app.config.js recusa builds com URL ausente ou loopback, e exige HTTPS fora do perfil apk-local. O código/configuração revisados permitem que o APK use o IP informado, mas somente o teste real no celular confirma que rede, firewall e servidor estão acessíveis.

No celular, abra http://172.20.135.67:3000/api/health antes de tentar login. Computador e celular precisam estar na mesma rede com comunicação entre clientes liberada. O IP pode mudar ao trocar de rede ou renovar DHCP. O computador, MySQL e API devem permanecer ligados. Fora dessa rede, o APK local não acessará a API. Se a URL mudar, o APK existente continuará usando a URL incorporada; planeje uma nova versão posteriormente.

INTERNET está explícita no app.json e não pede permissão em tempo de execução. A introspecção anterior confirmou usesCleartextTraffic=true para apk-local e false para apk. HTTP no perfil local é liberado para o aplicativo inteiro e transmite senha/JWT sem criptografia: restrinja a demonstração a uma rede confiável e contas de teste. Se necessário, libere Node/porta 3000 apenas no perfil de rede privada do firewall; nenhuma regra foi alterada automaticamente. Não exponha MySQL/3306 ou portas do roteador.

Para avaliação externa, use uma API HTTPS real com certificado válido, hospedada ou através de túnel aprovado. Não há URL pública confirmada. `expo start --tunnel` publica Metro, não a API. Túnel temporário depende de disponibilidade/URL estável; certificado autoassinado pode falhar no Android. Não desative validação TLS.

## EAS e geração do APK

O perfil apk-local em eas.json contém `environment: preview`, `distribution: internal` e `android.buildType: apk`. O perfil apk usa production, também gera APK e exige HTTPS. Ambos são builds de release, sem developmentClient; o APK não precisa de Metro ou Expo Go para abrir.

O ambiente remoto selecionado fornece EXPO_PUBLIC_API_URL ao servidor EAS. Uma variável só no terminal não substitui a configuração remota. O projectId é um identificador público, não uma credencial. A configuração já está vinculada: não repita eas init.

Comando usado para gerar o APK, apenas como referência de reprodução futura — não executar nesta atualização:

```powershell
npx eas-cli@latest build --platform android --profile apk-local
```

Não foram executados comandos EAS nesta revisão. O sucesso do build foi informado pelo usuário; a instalação no aparelho ainda não foi verificada. Preserve a conta e o keystore para futuras atualizações; não publique credenciais. Não precisa de conta Google Play para instalar diretamente. Revise quota, fila e eventuais custos em [Expo Pricing](https://expo.dev/pricing) antes de qualquer envio futuro. O build não hospeda o backend.

## Instalação e testes manuais no Android

Baixe o APK pelo link do build no celular quando um aparelho estiver disponível. Permita temporariamente instalação de apps desconhecidos para o navegador/gerenciador usado, instale e revogue a permissão depois. Com Platform Tools e depuração USB autorizada, alternativa: adb install -r caminho-do-arquivo.apk. Não desinstale nem apague dados para contornar erro de assinatura sem avaliar o problema.

Roteiro pendente para o APK real; use contas e registros próprios de demonstração, preservando os dados existentes:

1. Abra /api/health no navegador do celular e depois o APK sem Expo Go/Metro.
2. Confira senha incorreta, login correto do Aluno, logout, novo login e botão Voltar sem reabrir dados da conta anterior.
3. Crie matéria e tarefa de demonstração; edite, conclua/reabra e confira resumo/progresso. A exclusão deve ser testada apenas se autorizada, em registros descartáveis próprios; não apague registros existentes nesta etapa.
4. Entre como Responsável e solicite pelo e-mail do Aluno. No Aluno, autorize. No Responsável, atualize e abra detalhes: apenas leitura.
5. Revogue no Aluno, volte/atualize o Responsável e confirme bloqueio. O servidor nega novas leituras após revogação; a interface consulta na retomada e a cada 30 segundos em foco. Não há push instantâneo.
6. Confira teclado, rolagem, calendário, formulários, navegação e retomada em tela pequena. Reiniciar o app exige novo login.
7. Em janela combinada com quem usa a API, teste indisponibilidade de rede: mensagem de conexão e recuperação ao tentar novamente. Não interrompa demonstrações/testes de outras pessoas.

A Entrega 3 tem confirmação anterior do usuário para login, cadastro de Responsável, solicitação, autorização e revogação. Isso não equivale a aprovação do novo APK Android. Registre aparelho, versão Android, data, resultado e link/ID do build no checklist após o teste físico.

## Testes automatizados e revisão desta etapa

```powershell
npm test
npm --prefix backend test
npm run lint
npm run typecheck
npx expo install --check
npx expo-doctor
npx expo export --platform web
npm run test:web:perfis
```

Verificação final: 27 testes frontend aprovados; 33 backend aprovados e 1 MySQL opt-in desativado; lint, typecheck e compilação Web aprovados. Expo Doctor: 19/20, recomendando expo ~58.0.26 e expo-router ~58.0.32. API e conexão MySQL responderam aos endpoints de saúde; os fluxos completos com API e banco reais não foram confirmados. Smoke Edge headless aprovado com API simulada e exportação Web anterior: cadastro/perfis, login/redirecionamento, solicitação, aprovação/recusa, revogação, somente leitura, limpeza após 404 e largura 390 px. A exportação Android da etapa anterior também passou; nenhum desses resultados substitui a instalação do APK.

A revisão de sessão/JWT, rotas por perfil, CRUD por proprietário, versionamento das decisões e invalidação após revogação não indicou necessidade de mudanças funcionais para esta etapa. Rolagem, mensagens de erro/carregamento e formulários foram preservados. Typecheck cobre os layouts TypeScript; JavaScript legado permanece com checkJs=false. A instalação anterior reportou 8 alertas moderados; não houve nova auditoria de vulnerabilidades nem audit fix --force. O aviso Node MODULE_TYPELESS_PACKAGE_JSON e avisos de cor do Metro não impediram as verificações.

## GitHub e fechamento

Repositório: https://github.com/nicolekauane/organizaai. A versão anterior foi publicada na branch entrega-3, commit b0e6581, conforme confirmação do usuário. A publicação desta atualização tem como destino exclusivo origin/entrega-3, sem merge na master.

Git status/diff foram revisados. Somente backend/.env.example está versionado entre os arquivos de ambiente listados; .env reais, credenciais locais, backups e builds são ignorados. Não use git add -f. Antes de um futuro commit, confira `git diff --cached --name-only` e `git diff --cached --check`; APK deve ser entregue por link EAS, não incluído no código-fonte. A revisão atual não alterou app.json, app.config.js, eas.json, dependências ou funcionalidades; manteve os ajustes locais da etapa anterior e o vínculo EAS feito pelo usuário.

Pendências e evidências: [checklist final](CHECKLIST_ENTREGA_4.md). Roteiro para ensaio: [apresentação](APRESENTACAO_ENTREGA_4.md). O APK foi gerado; instalação e teste físico permanecem pendentes.

Referências: [SDK 58](https://docs.expo.dev/versions/v58.0.0/), [APK](https://docs.expo.dev/build-reference/apk/), [variáveis EAS](https://docs.expo.dev/eas/environment-variables/).
