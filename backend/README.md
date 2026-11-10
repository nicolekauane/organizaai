# Backend — Organiza Aí — Entrega 3

API Node.js, Express 5 e MySQL >= 8.0.16. Autenticação com JWT HS256 (15 minutos), senhas com scrypt e limites de tentativas com express-rate-limit.

## Instalação e execução

1. Instale Node.js/npm e MySQL. Na pasta backend, execute `npm ci`.
2. Apenas em instalação nova, crie/selecione organiza_ai e importe database/organiza_ai.sql pelo Workbench/cliente com suporte a DELIMITER. Não reimporte em banco existente. Consulte [o banco](../database/README.md).
3. Se não houver ambiente local, copie .env.example para .env e configure PORT, DB_HOST, DB_PORT, DB_USER, DB_PASSWORD, DB_NAME e DB_CONNECTION_LIMIT. Não sobrescreva um .env existente.
4. Configure JWT_SECRET privado e aleatório de pelo menos 32 bytes. Para gerar localmente: `node -e "console.log(require('node:crypto').randomBytes(48).toString('hex'))"`. Não compartilhe o resultado.
5. Execute `npm start`, ou `npm run dev` para reiniciar ao salvar.
6. Confira GET /api/health e GET /api/health/db (somente SELECT 1). Reinicie processos antigos após alterar rotas.

No frontend, configure EXPO_PUBLIC_API_URL se necessário; padrão http://localhost:3000. Em celular físico, use o IP do computador acessível na mesma rede. Nunca coloque JWT_SECRET em EXPO_PUBLIC_*. Use HTTPS na publicação.

## Autenticação e perfis

| Método | Endpoint | Corpo e resposta |
| --- | --- | --- |
| POST | /api/auth/cadastro | nome, email, senha, tipo_usuario opcional; 201 { usuario } |
| POST | /api/auth/login | email, senha; 200 { token, token_type, expires_in, usuario } |
| GET | /api/auth/me | Bearer; 200 { usuario } |

Nome: 1–100 caracteres; e-mail: até 150; senha: 8–128. Cadastro aceita aluno (padrão) ou responsavel. Não existe alteração de perfil pela API. Respostas nunca incluem senha/hash. Cadastro duplicado retorna 409; credenciais inválidas, 401; excesso de tentativas, 429 (10 por IP em 15 minutos, por endpoint).

Envie Authorization: Bearer TOKEN nas rotas privadas. O backend valida assinatura, algoritmo, emissor, audiência, expiração e identidade. O perfil atual vem do banco em cada operação protegida. Sem sessão/conta: 401; perfil incorreto: 403. Corpo/query/claims extras não concedem acesso. /api/usuarios permanece bloqueado (403).

O token fica somente em memória no aplicativo. /me confirma o perfil antes da navegação. Logout é local; um token copiado permanece válido até expirar. Não há refresh token ou revogação individual de JWT.

## CRUD do aluno

Para /api/materias e /api/tarefas: GET / lista, GET /:id consulta, POST / cria, PUT /:id substitui os campos e DELETE /:id exclui. Somente aluno pode usar; todas as consultas usam o dono identificado pelo JWT. Nunca envie usuario_id para autorizar acesso.

Matéria: nome obrigatório (até 100), professor opcional (até 100) e cor opcional #RRGGBB. Tarefa: titulo obrigatório (até 150), descricao opcional, data_entrega opcional YYYY-MM-DD, prioridade baixa/media/alta, status pendente/em andamento/concluida e materia_id opcional. O ID deve ser inteiro positivo compatível com INT MySQL e pertencer ao aluno. Datas impossíveis ou anteriores a 1000-01-01 são rejeitadas. Omitir prazo/matéria equivale a null.

Listagens retornam arrays; consulta/atualização retorna objeto; criação retorna 201; exclusão retorna 204 sem corpo. Concluir/reabrir usa PUT com todos os campos e o novo status. Não existe PATCH. Recurso inexistente ou de outro dono retorna o mesmo 404. Excluir matéria mantém tarefas com materia_id NULL pela FK existente.

## Acompanhamento e consentimento

| Método | Endpoint | Permissão |
| --- | --- | --- |
| POST | /api/vinculos/solicitacoes | Responsável; { email } |
| GET | /api/vinculos | Ambos; vínculos da própria conta |
| POST | /api/vinculos/:id/autorizar | Aluno; pendente para autorizado |
| POST | /api/vinculos/:id/recusar | Aluno; pendente para recusado |
| POST | /api/vinculos/:id/revogar | Aluno; autorizado para revogado |
| GET | /api/acompanhamento/alunos | Responsável; alunos autorizados |
| GET | /api/acompanhamento/alunos/:alunoId/materias | Responsável autorizado |
| GET | /api/acompanhamento/alunos/:alunoId/tarefas | Responsável autorizado |
| GET | /api/acompanhamento/alunos/:alunoId/resumo | Responsável autorizado |

Solicitação normaliza o e-mail e responde 202 genérico para e-mail válido, inclusive inexistente/duplicado. Limites: 10 por conta e 30 por IP em 15 minutos. Renovação de recusado/revogado exige 24 horas desde solicitação e encerramento e nova aprovação explícita; nunca concede acesso automaticamente.

Decisões exigem { solicitado_em: "YYYY-MM-DD HH:mm:ss" } exatamente como recebido na lista, sem conversão de fuso. Retornam { id, status }. Versão antiga/transição inválida: 409; concorrência com deadlock/timeout: 503 e Retry-After. Atualize a lista e decida novamente, sem repetição automática.

Detalhes verificam perfil e vínculo a cada leitura; acesso ausente/revogado retorna 404. O acompanhamento oferece apenas GET; tentativas de escrita retornam 404, e o CRUD de aluno retorna 403 para responsável. Resumo: { materias, tarefas: { total, pendente, em_andamento, concluida }, progresso }. Sem tarefas, contagens/progresso são zero.

Transações e bloqueios serializam decisões e revogação. Após concluir revogação, novas leituras são negadas. Respostas anteriores podem estar em trânsito. A interface descarta os dados ao perder acesso/foco, sair ou expirar, e consulta novamente ao retomar e a cada 30 segundos em foco.

## Erros e segurança

Erros têm { error }; JSON malformado retorna 400; corpo acima de 100 KB retorna 413; falhas internas retornam 500 sem SQL/credenciais. Respostas /api usam Cache-Control: no-store. Consultas SQL são parametrizadas. CORS está liberado para desenvolvimento; antes de hospedagem pública, revisar origens, HTTPS e topologia de proxy. Os limites são por processo; múltiplas instâncias exigem armazenamento compartilhado.

## Testes

Execute `npm test` e `npm audit` nesta pasta. Testes HTTP usam adaptador SQL em memória, sem alterar o banco real.

O teste MySQL é opt-in e exige banco separado já existente no formato organiza_ai_teste_41_<16 hexadecimais>, em ORGANIZA_AI_TEST_DATABASE. Não o aponte para o banco principal. Usa rollback das fixtures, mas AUTO_INCREMENT pode avançar. Não foi habilitado na revisão final; nenhuma migração ou escrita real foi executada.

Consulte [o roteiro manual](../docs/ENTREGA_3_FRONTEND.md) e [a revisão final](../docs/REVISAO_FINAL_ENTREGA_3.md).
