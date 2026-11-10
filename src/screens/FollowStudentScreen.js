import React, { useCallback } from 'react';
import { Text, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { carregarAluno } from '../services/acompanhamentoService';
import { usePrivateResource } from '../hooks/usePrivateResource';
import { FollowPage, ActionButton, styles } from '../components/FollowUI';
import TaskItem from '../components/TaskItem';
import SubjectItem from '../components/SubjectItem';
import StatCard from '../components/StatCard';
import { mapTaskForDisplay, mapSubjectForDisplay } from '../utils/dataMappers';
import { palette, sharedStyles } from '../styles/theme';
export default function FollowStudentScreen() {
  const { alunoId } = useLocalSearchParams();
  const load = useCallback(() => carregarAluno(alunoId), [alunoId]);
  const { data, loading, error, reload } = usePrivateResource(load, 'responsavel');
  return <FollowPage title={data?.aluno.nome || 'Acompanhamento'} subtitle="Somente leitura. O aluno controla a autorização de acesso." loading={loading} error={error} reload={reload}>
    <ActionButton title="Voltar aos alunos" secondary onPress={() => router.replace('/acompanhamento')} />
    {data && !loading && <>
      <Text accessibilityRole="header" style={[sharedStyles.sectionTitle, styles.section]}>Resumo do progresso</Text>
      <View style={styles.stats}>
        {[['Matérias', data.resumo.materias], ['Tarefas', data.resumo.tarefas.total], ['Pendentes', data.resumo.tarefas.pendente], ['Em andamento', data.resumo.tarefas.em_andamento], ['Concluídas', data.resumo.tarefas.concluida], ['Progresso', data.resumo.progresso + '%']].map(([label, value]) => <View key={label} style={styles.stat}><StatCard label={label} value={String(value)} tone={palette.rosaSuave} /></View>)}
      </View>
      <Text accessibilityRole="header" style={[sharedStyles.sectionTitle, styles.section]}>Matérias</Text>
      {!data.materias.length && <Text style={styles.message}>Este aluno ainda não cadastrou matérias.</Text>}
      {data.materias.map(subject => <SubjectItem key={subject.id} subject={mapSubjectForDisplay(subject, data.tarefas)} />)}
      <Text accessibilityRole="header" style={[sharedStyles.sectionTitle, styles.section]}>Tarefas</Text>
      {!data.tarefas.length && <Text style={styles.message}>Este aluno ainda não cadastrou tarefas.</Text>}
      {data.tarefas.map(task => <View key={task.id}>
        <TaskItem task={mapTaskForDisplay(task, data.materias)} />
        {!!task.descricao && <Text style={styles.description}>{task.descricao}</Text>}
      </View>)}
    </>}
  </FollowPage>;
}
