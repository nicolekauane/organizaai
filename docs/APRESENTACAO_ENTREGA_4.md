# Apresentação — Organiza Aí — Entrega 4

Duração sugerida: 5 a 7 minutos. Deixe a API/MySQL ligados e o celular na rede correta. Tenha duas contas de demonstração, uma Aluno e uma Responsável, sem projetar senhas, tokens ou o arquivo .env. Use registros próprios e preserve os dados existentes.

1. **Introdução e objetivo (30 s).** “O Organiza Aí ajuda estudantes a organizar matérias, tarefas e prazos em um só lugar. O acompanhamento por responsáveis acontece somente com autorização do aluno.”
2. **Tecnologias (30 s).** “O aplicativo usa React Native com Expo e Expo Router. O backend é Node.js/Express, com autenticação JWT e MySQL. O EAS Build compila a versão Android.”
3. **Login e perfis (40 s).** Mostre o login do Aluno. Explique que cada conta tem seu perfil e acesso protegido. “O Aluno organiza a rotina; o Responsável consulta apenas o que foi autorizado, sem editar.” Não mostre a senha digitada.
4. **Matérias e tarefas (1 min).** Abra Matérias e uma tarefa própria de demonstração. Mostre nome, professor/cor, prazo, prioridade e status. Edite ou conclua uma tarefa e confira o progresso no Início. Explique que os dados pertencem à conta autenticada. Não apague registros.
5. **Solicitação e autorização (1 a 2 min).** Saia e entre como Responsável; solicite pelo e-mail da conta Aluno. Volte ao Aluno e autorize. No Responsável, atualize a lista e abra as matérias/tarefas, destacando a ausência de ações de edição.
6. **Revogação (40 s).** No Aluno, revogue o acesso. Volte ao Responsável e atualize/retome a tela para mostrar o bloqueio. “A API confere o vínculo em cada leitura; a tela também atualiza ao retomar e a cada 30 segundos.” Não prometa atualização por push. Depois de revogar, uma nova solicitação tem espera de 24 horas: faça essa demonstração por último.
7. **API e MySQL (30 s).** “O celular chama a API, que valida o JWT e as permissões e consulta o MySQL. O celular não se conecta diretamente ao banco.” Se necessário, mostre apenas /api/health; não abra .env, Workbench com dados pessoais ou logs de autenticação.
8. **APK Android (30 s).** Se instalado e validado, abra o Organiza Aí pelo ícone e explique que funciona sem Expo Go ou Metro. “Nesta avaliação, a API está no computador e depende da mesma rede Wi-Fi.” Se o build ainda não terminou ou não foi testado, diga que está pendente e demonstre a versão Web; não apresente o APK como concluído.
9. **GitHub e testes (30 s).** Abra https://github.com/nicolekauane/organizaai na branch entrega-3. Mostre README e documentação disponíveis. Antes do commit/push, explique que a documentação final está local e aguarda publicação. Cite 27 testes frontend e 33 backend aprovados, lint/typecheck, Expo Doctor e smoke Web; ressalte o teste físico como verificação separada.
10. **Conclusão (20 s).** “O projeto integra organização escolar, autenticação e acompanhamento com consentimento. A entrega final inclui código, documentação, apresentação e o APK depois da instalação e validação no Android.” Atualize essa última frase conforme o checklist real.

## Preparação e plano de apoio

- Ensaiar a troca de contas e conferir nomes das telas antes da aula.
- Confirmar /api/health pelo celular e carregar previamente o link do build e do GitHub.
- Conferir o checklist e dizer somente o que estiver confirmado.
- Se houver falha de rede/APK, usar o Web com a API local para demonstrar os fluxos e explicar a limitação. Não iniciar outro build durante a apresentação para tentar resolver.
- Registrar ID/link do APK e aparelho testado no [checklist](CHECKLIST_ENTREGA_4.md). Capturas de apoio, se produzidas, devem ocultar dados pessoais e credenciais.
