export const isTaskCompleted = (task) => String(task?.status || '').toLowerCase() === 'concluida';
export function mapTaskForDisplay(task, subjects = []) {
  const subject = subjects.find((item) => String(item.id) === String(task.materia_id));
  const priorities = { alta: 'Alta', media: 'Média', baixa: 'Baixa' };
  const statuses = { pendente: 'Pendente', 'em andamento': 'Em andamento', concluida: 'Concluída' };
  const due = task.data_entrega ? String(task.data_entrega).slice(0, 10).split('-') : [];
  return { id: String(task.id), title: task.titulo,
    subject: subject?.nome || (task.materia_id ? 'Matéria ' + task.materia_id : 'Sem matéria'),
    color: subject?.cor || undefined, due: due.length === 3 ? due.reverse().join('/') : 'Sem prazo',
    priority: priorities[String(task.prioridade || '').toLowerCase()] || 'Média',
    status: statuses[String(task.status || '').toLowerCase()] || task.status || 'Pendente',
    isCompleted: isTaskCompleted(task) };
}
export function mapSubjectForDisplay(subject, tasks = []) {
  const related = tasks.filter((task) => String(task.materia_id) === String(subject.id));
  const completed = related.filter(isTaskCompleted).length;
  return { id: String(subject.id), name: subject.nome, teacher: subject.professor || 'Professor não informado',
    tasks: related.length, progress: related.length ? Math.round(completed * 100 / related.length) : 0,
    color: subject.cor || undefined };
}
