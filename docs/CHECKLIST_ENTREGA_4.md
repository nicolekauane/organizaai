# Checklist final — Entrega 4

Atualizado em 19/11/2026. Marcar somente após confirmação; nenhum item pendente foi presumido concluído.

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
- [x] Lint e typecheck aprovados. Expo Doctor: 19/20; recomenda expo ~58.0.26 e expo-router ~58.0.32 (instalados 58.0.25 e 58.0.31).
- [x] Compilação Web aprovada; smoke de perfis aprovado com API simulada e exportação anterior (390 px).
- [x] API /api/health e conectividade MySQL em /api/health/db confirmadas; esta última usa SELECT 1.
- [ ] Testes completos dos fluxos com API e banco reais confirmados.
- [x] Git status/diff revisados; ambientes reais, credenciais, backups e builds fora dos arquivos candidatos.
- [x] Roteiro de apresentação pronto em APRESENTACAO_ENTREGA_4.md.
- [ ] Apresentação ensaiada com contas de demonstração e rede da avaliação.
- [ ] Atualizar este checklist com as evidências reais do APK.
- [x] Versão anterior publicada no GitHub em origin/entrega-3: commit b0e6581.
- [x] Publicação anterior na branch entrega-3 confirmada pelo usuário.

## Evidências do APK — preencher após o teste

- Link/ID do [build APK](https://expo.dev/accounts/nicolemueller/projects/organiza-ai/builds/ba269caf-9115-49da-a5b3-c15d13ce8879): ba269caf-9115-49da-a5b3-c15d13ce8879.
- Resultado do build: sucesso confirmado pelo usuário nesta etapa; data/hora exata de conclusão não consultada.
- Aparelho e versão Android: pendente.
- Data e responsável pelo teste: pendente.
- API acessível pelo celular: pendente.
- Resultado dos fluxos e problemas encontrados: pendente.
- Versão anterior publicada em [entrega-3](https://github.com/nicolekauane/organizaai/tree/entrega-3), commit b0e6581.

## Limitações que devem ser informadas

API local depende de computador/API/MySQL ligados, IP correto e rede que permita comunicação. HTTP é restrito à rede confiável de testes; não existe HTTPS público confirmado. A sessão fica em memória, expira em 15 minutos e exige novo login após reiniciar. Acompanhamento verifica acesso ao retomar e a cada 30 segundos em foco, sem push. Renovação após revogação/recusa exige 24 horas. Os testes simulados não substituem o APK físico; o teste MySQL opt-in não foi habilitado. O registro anterior aponta 8 alertas moderados de dependências; não houve nova auditoria ou correção forçada nesta revisão.

## Publicação

A branch entrega-3 rastreia origin/entrega-3. A publicação anterior foi confirmada pelo usuário. O destino explícito é origin/entrega-3, sem merge na master. Entregar o APK por link EAS, sem adicioná-lo ao Git.
