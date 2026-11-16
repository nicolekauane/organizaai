# Checklist final — Entrega 4

Atualizado em 16/11/2026. Marcar somente após confirmação; nenhum item pendente foi presumido concluído.

- [x] Projeto @nicolemueller/organiza-ai vinculado; projectId local conferido.
- [x] Perfil apk-local configurado para APK e ambiente preview.
- [x] URL preview informada pelo usuário: http://172.20.135.67:3000 (não consultada remotamente nesta revisão).
- [x] Build iniciado pelo usuário; nenhuma nova execução/cancelamento nesta revisão.
- [x] APK gerado com sucesso no EAS, conforme confirmação do usuário.
- [ ] APK instalado e aberto no Android sem Expo Go/Metro.
- [ ] API acessível pelo navegador do celular na mesma rede.
- [ ] Login/logout dos dois perfis testados no APK.
- [ ] Matérias, tarefas, edição, conclusão/reabertura e resumo testados no APK.
- [ ] Solicitação, autorização, acompanhamento somente leitura e revogação testados no APK.
- [ ] Teclado, rolagem, calendário, botão Voltar, retomada e falha de rede conferidos no Android.
- [x] README e guia APK atualizados com tecnologias, execução, banco, EAS, limitações e testes.
- [x] Testes automatizados: frontend 27 aprovados; backend 33 aprovados e 1 MySQL opt-in desativado.
- [x] Lint, typecheck, Expo Doctor 20/20 e compatibilidade das dependências aprovados.
- [x] Compilação Web e smoke de perfis com API simulada aprovados (inclui 390 px).
- [x] Git status/diff revisados; ambientes reais, credenciais, backups e builds fora dos arquivos candidatos.
- [x] Roteiro de apresentação pronto em APRESENTACAO_ENTREGA_4.md.
- [ ] Apresentação ensaiada com contas de demonstração e rede da avaliação.
- [ ] Atualizar este checklist com as evidências reais do APK.
- [ ] Commit na entrega-3: autorizado pelo usuário; pendente no momento deste registro, confirmar ao término do comando.
- [ ] Push para origin/entrega-3 realizado e documentação conferida no GitHub; master preservada.

## Evidências do APK — preencher após o teste

- Link/ID específico do build: ainda não informado; consultar o [painel do projeto](https://expo.dev/accounts/nicolemueller/projects/organiza-ai/builds).
- Resultado do build: sucesso confirmado pelo usuário nesta etapa; data/hora exata de conclusão não consultada.
- Aparelho e versão Android: pendente.
- Data e responsável pelo teste: pendente.
- API acessível pelo celular: pendente.
- Resultado dos fluxos e problemas encontrados: pendente.
- Commit e push pendentes no momento deste registro; confirmar o resultado ao término da publicação autorizada em [entrega-3](https://github.com/nicolekauane/organizaai/tree/entrega-3).

## Limitações que devem ser informadas

API local depende de computador/API/MySQL ligados, IP correto e rede que permita comunicação. HTTP é restrito à rede confiável de testes; não existe HTTPS público confirmado. A sessão fica em memória, expira em 15 minutos e exige novo login após reiniciar. Acompanhamento verifica acesso ao retomar e a cada 30 segundos em foco, sem push. Renovação após revogação/recusa exige 24 horas. Os testes simulados não substituem o APK físico; o teste MySQL opt-in não foi habilitado. O registro anterior aponta 8 alertas moderados de dependências; não houve nova auditoria ou correção forçada nesta revisão.

## Publicação autorizada nesta etapa

A branch atual é entrega-3 e rastreia origin/entrega-3. O destino explícito `git push origin entrega-3` não atualiza master. Não fazer merge nem usar push --all/--mirror/--force. Antes de executar commit/push, conferir `git status --short`, `git diff`, `git diff --cached --name-only` e `git diff --cached --check`. Os dados locais de origin não substituem consulta atual ao servidor; permissões/proteções do GitHub não foram verificadas remotamente. Entregar APK por link EAS, sem adicioná-lo ao Git.
