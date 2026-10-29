# Organiza Aí

Aplicativo mobile de organização escolar desenvolvido com React Native + Expo.

## Objetivo da Entrega 1

A primeira entrega tem como foco a proposta do projeto, a estrutura inicial do app, as telas principais e a navegação entre elas. Nenhuma funcionalidade de banco de dados, autenticação ou API foi implementada nesta etapa.

## Tecnologias previstas

- React Native
- Expo
- React Navigation
- Node.js + Express (backend das próximas entregas)
- MySQL (banco de dados das próximas entregas)

## Estrutura inicial

- `App.js` - ponto de entrada da aplicação
- `src/navigation/` - navegação do app
- `src/screens/` - telas principais
- `src/components/` - componentes reutilizáveis
- `src/services/` - arquivos para integrações futuras com API
- `src/styles/` - estilos e paleta visual compartilhada
- `backend/` - estrutura do backend a ser desenvolvida nas próximas etapas
- `database/` - estrutura dos scripts e modelos do banco de dados

## Telas implementadas

1. Início: mensagem de boas-vindas e resumo das tarefas
2. Tarefas: listagem de atividades escolares com prioridade e status
3. Matérias: acompanhamento do progresso por disciplina

## Como executar

1. Instale as dependências:
   ```bash
   npm install
   ```
2. Inicie o projeto Expo:
   ```bash
   npm start
   ```
3. No emulador ou no Expo Go, selecione o projeto para rodar.

## Observações

- Os dados exibidos são temporários e fictícios.
- A navegação já está configurada entre as telas de início, tarefas e matérias.
- A identidade visual foi pensada em tons suaves de bordô, rosa-claro e branco para transmitir uma estética escolar, organizada e acolhedora.
