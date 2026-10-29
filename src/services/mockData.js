export const taskList = [
  {
    id: '1',
    title: 'Revisar exercícios de álgebra',
    subject: 'Matemática',
    due: 'Hoje, 18:00',
    priority: 'Alta',
    status: 'Pendente',
    color: '#E9A9C2',
  },
  {
    id: '2',
    title: 'Escrever resumo de biologia',
    subject: 'Biologia',
    due: 'Amanhã, 09:30',
    priority: 'Média',
    status: 'Em andamento',
    color: '#8DB5D8',
  },
  {
    id: '3',
    title: 'Preparar apresentação de História',
    subject: 'História',
    due: 'Qua, 15:00',
    priority: 'Alta',
    status: 'Pendente',
    color: '#F4C76A',
  },
  {
    id: '4',
    title: 'Entregar redação de Literatura',
    subject: 'Literatura',
    due: 'Sex, 08:00',
    priority: 'Baixa',
    status: 'Concluída',
    color: '#78B89A',
  },
];

export const subjectList = [
  {
    id: '1',
    name: 'Matemática',
    teacher: 'Prof. Moreira',
    tasks: 4,
    progress: 75,
    color: '#E9A9C2',
  },
  {
    id: '2',
    name: 'Biologia',
    teacher: 'Prof. Campos',
    tasks: 3,
    progress: 58,
    color: '#8DB5D8',
  },
  {
    id: '3',
    name: 'História',
    teacher: 'Prof. Azevedo',
    tasks: 2,
    progress: 67,
    color: '#F4C76A',
  },
  {
    id: '4',
    name: 'Português',
    teacher: 'Prof. Ribeiro',
    tasks: 5,
    progress: 81,
    color: '#D7787A',
  },
];

export const dashboardStats = [
  { label: 'Tarefas hoje', value: '4', tone: '#F6D4E2' },
  { label: 'Concluídas', value: '1', tone: '#D7F0E2' },
  { label: 'Pendentes', value: '3', tone: '#FDE7C4' },
];
