# Backend — Organiza Aí

API do Organiza Aí em Node.js, Express 5 e MySQL. A configuração usa variáveis de ambiente; não compartilhe o arquivo `.env` nem coloque credenciais reais no Git.

## Configuração

1. Inicie o MySQL, crie o banco `organiza_ai` e importe `../database/organiza_ai.sql` pelo MySQL Workbench ou cliente MySQL. O arquivo SQL cria as tabelas, mas pressupõe que o banco já existe.
2. Entre nesta pasta e instale as dependências com `npm install`.
3. Copie `.env.example` para `.env` e configure localmente host, porta, usuário e senha do MySQL. Mantenha `.env` fora do Git.
4. Inicie o servidor com `npm start` ou use `npm run dev` durante o desenvolvimento para reiniciar ao salvar.

Por padrão, o servidor escuta em `http://localhost:3000`. Se estiver usando um celular físico, troque `localhost` pelo endereço IP local do computador nas chamadas feitas pelo celular.

## Rotas e verificação

- `GET http://localhost:3000/api/health` verifica o servidor.
- `GET http://localhost:3000/api/health/db` executa `SELECT 1` e verifica a conexão com o banco.
- `/api/usuarios`, `/api/materias` e `/api/tarefas` oferecem operações CRUD.
- Listagens de matérias e tarefas aceitam `usuario_id` como filtro de consulta. O app configura o ID de teste por `EXPO_PUBLIC_TEST_USER_ID` no `.env.local` da raiz.
- Criação e atualização recebem JSON; alterações e exclusões de matérias/tarefas também recebem o `usuario_id` para verificar o vínculo solicitado.
- Excluir usuário remove suas matérias e tarefas por `ON DELETE CASCADE`; excluir matéria define o `materia_id` das tarefas relacionadas como `NULL`.

Para atualizar matéria ou tarefa, envie `usuario_id` no corpo; a consulta só altera um registro que pertença a esse usuário. Para excluir matéria ou tarefa, informe `usuario_id` na query string. IDs inexistentes retornam `404`; registros encontrados com outro `usuario_id` retornam `403`.

**Limite de autorização:** a Entrega 2 não implementa login, JWT nem autenticação. `usuario_id` é informado pelo cliente e funciona como filtro, portanto pode ser falsificado; não oferece isolamento seguro entre usuários. Login, JWT e autorização baseada em identidade ficam para a Entrega 3.

As consultas SQL usam parâmetros. Uma tarefa vinculada a uma matéria exige que a matéria pertença ao mesmo usuário. O aplicativo da Entrega 2 usa as rotas de matérias e tarefas para cadastrar, consultar, editar e excluir registros, além de concluir e reabrir tarefas.
