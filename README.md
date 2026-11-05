# Organiza Aí

Aplicativo de organização escolar desenvolvido com React Native e Expo Web. A API usa Node.js e Express, com persistência em MySQL.

## Entrega 2

O aplicativo consulta e gerencia matérias e tarefas associadas ao ID temporário de usuário configurado localmente:

- cadastra, consulta, edita e exclui matérias, com professor opcional e seleção de cor;
- cadastra, consulta, edita e exclui tarefas, com descrição, data de entrega e matéria opcionais;
- permite concluir e reabrir tarefas;
- exibe na tela Início totais de tarefas pendentes e concluídas e até três próximas atividades;
- mostra o progresso das matérias com base nas tarefas associadas;
- atualiza os dados ao retornar às telas e informa carregamento, erros e listas vazias.

Login, JWT e autenticação não fazem parte da Entrega 2; ficam para a Entrega 3. O ID configurado é apenas um filtro enviado pelo cliente e não protege os dados contra falsificação.

## Requisitos

- Node.js e npm para executar o backend e o Expo;
- MySQL para persistência;
- React Native, Expo e Expo Web para o aplicativo (as dependências estão em `package.json`).

## Banco de dados MySQL

Inicie o MySQL, crie o banco `organiza_ai` e importe `database/organiza_ai.sql` pelo MySQL Workbench ou cliente MySQL. O script cria as tabelas com relacionamentos entre usuários, matérias e tarefas. Depois configure a conexão no ambiente local do backend.

## Backend — Node.js, Express e MySQL

1. Entre em `backend` e instale as dependências com `npm install`.
2. Copie `backend/.env.example` para `backend/.env` e preencha os valores locais de conexão com o MySQL. Não use credenciais reais no arquivo de exemplo nem o envie ao GitHub.
3. Inicie o servidor com `npm start`; para desenvolvimento com reinício automático, use `npm run dev`.
4. Confira `http://localhost:3000/api/health` e `http://localhost:3000/api/health/db`.

A API expõe CRUD para usuários, matérias e tarefas. O aplicativo nesta entrega usa os recursos de matérias e tarefas. Detalhes dos endpoints estão em [backend/README.md](backend/README.md).

## Expo Web

1. Na raiz do projeto, instale as dependências com `npm install`.
2. Crie `.env.local` na raiz e informe o ID de um usuário que já exista no banco:

   ```env
   EXPO_PUBLIC_TEST_USER_ID=ID_EXISTENTE
   ```

   Essa variável é incorporada ao bundle público; informe somente o ID, nunca uma senha ou segredo. Reinicie o Expo depois de alterá-la.
3. Inicie o aplicativo com `npm run web`.

A URL da API está centralizada em `src/services/api.js` e, por padrão, é `http://localhost:3000`. No Expo Web, `localhost` deve ser o computador que executa a API. Para um dispositivo físico, use o IP local do computador e permita conexões pela rede.

## Uso

- **Matérias:** `+ Nova matéria` abre o formulário com nome obrigatório e professor opcional. Há uma paleta, seletor de cor no Web e entrada hexadecimal. Os cards permitem editar e excluir.
- **Tarefas:** `+ Nova tarefa` permite preencher título obrigatório, descrição, data, prioridade, status e matéria. A matéria é opcional; as matérias existentes são carregadas da API. O calendário mostra `DD/MM/AAAA` e a API recebe `YYYY-MM-DD`. Os cards permitem editar, excluir, concluir e reabrir tarefas.
- **Início:** mostra totais reais e até três tarefas pendentes com prazo mais próximo.
- O progresso de cada matéria é a porcentagem das tarefas vinculadas que estão concluídas. Ao excluir uma matéria, as tarefas relacionadas permanecem sem matéria, conforme a chave estrangeira.

## Variáveis locais e segurança

O `.gitignore` exclui `.env`, `.env.local`, `backend/.env`, `node_modules` e saídas de build. `backend/.env.example` contém apenas nomes e valores de exemplo. Confira os arquivos locais de ambiente com `git check-ignore .env .env.local backend/.env`.

O `usuario_id` temporário é um filtro informado pelo cliente, não autenticação. A API ainda não autentica a identidade da pessoa que faz a requisição; um cliente pode falsificar o ID. Login, JWT e autorização confiável ficam para a Entrega 3.

## Roteiro de teste manual

1. Inicie o MySQL e o backend; confirme `/api/health/db`.
2. Configure em `.env.local` o ID de um usuário existente, inicie o Expo com `npm run web` e navegue pelas telas Início, Tarefas e Matérias.
3. Cadastre, edite e exclua uma matéria; experimente a paleta e a cor personalizada.
4. Cadastre uma tarefa vinculada a uma matéria, edite-a, conclua-a e reabra-a. Confira a data exibida e o comportamento opcional da data.
5. Exclua uma tarefa com confirmação e confira as contagens na tela Início.
6. Confira que arquivos de ambiente locais são ignorados com `git check-ignore .env .env.local backend/.env`.

## Endpoints usados pelo aplicativo

- `GET/POST /api/materias`, `PUT/DELETE /api/materias/:id`
- `GET/POST /api/tarefas`, `PUT/DELETE /api/tarefas/:id`

As consultas usam `usuario_id`; POST/PUT o enviam no corpo e DELETE na query string. Esses filtros não substituem autenticação.
