# Organiza Aí

Aplicativo mobile de organização escolar desenvolvido com React Native + Expo.

## 1. Problema atual identificado

Muitos estudantes enfrentam dificuldade para organizar suas tarefas, prazos, matérias e estudos em um único ambiente. Em geral, a rotina escolar envolve diversas atividades simultâneas, como provas, entregas, trabalhos, revisões e compromissos pessoais, o que pode gerar esquecimentos, falta de planejamento e sensação de sobrecarga.

Além disso, a maioria dos alunos utiliza métodos dispersos para acompanhar sua vida acadêmica, como agendas físicas, lembretes do celular, aplicativos separados e anotações manuais. Esse cenário dificulta a visualização do progresso escolar e aumenta o risco de atrasos e baixa organização.

## 2. Contexto e público afetado

O problema afeta principalmente estudantes do ensino médio, ensino técnico e universitários, além de jovens que precisam equilibrar estudos, atividades extracurriculares e rotina pessoal. Esse público costuma ter uma agenda intensa e exige uma forma simples, prática e visual de acompanhar tarefas e matérias.

O aplicativo foi pensado para atender alunos que desejam melhorar sua organização acadêmica, reduzir a ansiedade causada pela falta de controle e manter uma rotina mais estruturada.

## 3. Justificativa

A organização escolar é fundamental para o desempenho acadêmico e para a qualidade de vida do estudante. Quando o aluno não consegue controlar suas pendências, tende a perder prazos, esquecer atividades importantes e se sentir mais pressionado ao longo do período letivo.

Por isso, é importante oferecer uma solução digital acessível, intuitiva e voltada para o contexto escolar. O Organiza Aí busca facilitar a rotina escolar, tornar o planejamento mais eficiente e apoiar os estudantes em sua organização pessoal e acadêmica.

## 4. Proposta de solução

O Organiza Aí é um aplicativo mobile pensado para centralizar informações importantes da vida escolar em um único lugar. A proposta é permitir que o estudante visualize suas tarefas, acompanhe o status das matérias e organize melhor sua rotina diária e semanal.

A solução busca oferecer uma interface simples e amigável, com foco na organização, produtividade e acompanhamento do desempenho acadêmico.

## 5. Nome da aplicação

Organiza Aí

## 6. Tipos de usuário

O sistema foi planejado para atender principalmente dois perfis:

- Aluno: usuário principal do aplicativo, responsável por acompanhar tarefas, matérias e progresso escolar.
- Responsável/monitor: perfil complementar, que pode acompanhar a rotina do estudante em aspectos gerais de organização e atividades pendentes.

## 7. Permissões iniciais de cada usuário

### Aluno
- Acesso ao painel inicial com resumo geral.
- Visualização das tarefas cadastradas.
- Acompanhamento das matérias e do progresso por disciplina.
- Navegação entre telas de início, tarefas e matérias.
- Visualização de pendências e atividades próximas.

### Responsável/monitor
- Acesso às informações gerais da rotina escolar.
- Visualização do status das tarefas e matérias do aluno.
- Consulta de atividades em andamento e pendentes.
- Acesso restrito às informações acadêmicas essenciais, sem edição de dados no momento inicial do projeto.

## 8. Principais funcionalidades

- Visualização de resumo geral da rotina escolar;
- Acompanhamento de tarefas com prioridade e status;
- Organização das atividades por semana ou período;
- Listagem de matérias e acompanhamento do desempenho por disciplina;
- Navegação simples entre telas principais;
- Interface visual clara e acolhedora para facilitar o uso do aluno;
- Exibição de informações em formato de cards e listas para facilitar a leitura;
- Organização inicial da rotina escolar em um ambiente único.

## 9. Telas previstas

A estrutura inicial do aplicativo contempla as seguintes telas:

1. Tela inicial (Home)
   - mensagem de boas-vindas;
   - resumo do dia ou da semana;
   - acesso rápido para tarefas e matérias.

2. Tela de tarefas
   - listagem das atividades escolares;
   - identificação de prioridade;
   - status da tarefa;
   - organização visual das pendências.

3. Tela de matérias
   - informações das disciplinas;
   - acompanhamento do progresso por matéria;
   - visualização do andamento acadêmico.

4. Tela de navegação e organização geral
   - acesso entre as telas principais do aplicativo.

## 10. Fluxo inicial de navegação

O fluxo inicial do aplicativo é simples e direto:

- O usuário entra na tela inicial;
- Na tela inicial, ele pode acessar rapidamente a seção de tarefas ou a seção de matérias;
- A partir da tela de tarefas, pode retornar ao início ou acessar as matérias;
- A partir da tela de matérias, pode retornar ao início ou acessar as tarefas;
- O fluxo foi pensado para dar ao aluno uma experiência de navegação leve, clara e de fácil compreensão.

O fluxo principal pode ser representado assim:

Início -> Tarefas -> Matérias

ou

Início -> Matérias -> Tarefas

## 11. Tecnologias utilizadas

- React Native
- Expo
- React Navigation
- JavaScript
- Node.js (para estrutura futura do backend)
- MySQL (para futura persistência de dados)

## 12. Estrutura inicial do projeto

- `App.js` - ponto de entrada da aplicação
- `src/navigation/` - navegação do app
- `src/screens/` - telas principais
- `src/components/` - componentes reutilizáveis
- `src/services/` - arquivos para integrações futuras com API
- `src/styles/` - estilos e paleta visual compartilhada
- `backend/` - estrutura do backend a ser desenvolvida nas próximas etapas
- `database/` - estrutura dos scripts e modelos do banco de dados

## 13. Como executar o projeto

### Pré-requisitos

- Node.js instalado
- Expo CLI
- Emulador Android/iOS ou aplicativo Expo Go em um dispositivo móvel

### Passos

1. Abra o terminal na pasta do projeto.
2. Instale as dependências:

   ```bash
   npm install
   ```

3. Inicie o projeto Expo:

   ```bash
   npm start
   ```

4. No emulador ou no aplicativo Expo Go, selecione o projeto para execução.

## 14. Observações

- Os dados exibidos na primeira versão são temporários e fictícios.
- Esta entrega tem foco na proposta do projeto, estrutura inicial, navegação e telas principais.
- Funcionalidades de banco de dados, autenticação e integração de API serão desenvolvidas em etapas posteriores.
- A identidade visual foi pensada em cores suaves como bordô, rosa-claro e branco, buscando transmitir uma estética escolar, organizada e acolhedora.

## 15. Conclusão

O Organiza Aí foi pensado como uma ferramenta útil para estudantes que precisam organizar melhor sua rotina acadêmica. A proposta inicial busca centralizar tarefas, matérias e informações importantes em um único ambiente, tornando a vida escolar mais prática, clara e produtiva.

A primeira entrega apresenta a base do projeto, com a estrutura inicial do aplicativo, as telas principais e a navegação necessária para o funcionamento da solução proposta.
