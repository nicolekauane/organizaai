import React, { useCallback, useState } from 'react';
import { ActivityIndicator, ScrollView, View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import StatCard from '../components/StatCard';
import TaskItem from '../components/TaskItem';
import { consultarMaterias } from '../services/materiasService';
import { consultarTarefas } from '../services/tarefasService';
import { isTaskCompleted, mapTaskForDisplay } from '../utils/dataMappers';
import { TEST_USER_ID } from '../config/testUser';
import { palette, sharedStyles } from '../styles/theme';

export default function HomeScreen({ navigation }) {
  const [tasks, setTasks] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  useFocusEffect(useCallback(() => {
    let active = true;
    if (!TEST_USER_ID) {
      setTasks([]); setSubjects([]); setError(null); setLoading(false);
      return () => { active = false; };
    }
    setLoading(true); setError(null);
    Promise.all([consultarTarefas(TEST_USER_ID), consultarMaterias(TEST_USER_ID)])
      .then(([nextTasks, nextSubjects]) => { if (active) { setTasks(nextTasks); setSubjects(nextSubjects); } })
      .catch((e) => { if (active) setError(e.message || 'Não foi possível carregar o resumo.'); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []));
  const pending = tasks.filter((task) => !isTaskCompleted(task)).length;
  const completed = tasks.length - pending;
  const upcoming = tasks.filter((task) => !isTaskCompleted(task)).slice()
    .sort((a, b) => String(a.data_entrega || '9999-12-31').localeCompare(String(b.data_entrega || '9999-12-31')))
    .slice(0, 3).map((task) => mapTaskForDisplay(task, subjects));
  const stats = [
    { label: 'Tarefas', value: String(tasks.length), tone: '#F6D4E2' },
    { label: 'Concluídas', value: String(completed), tone: '#D7F0E2' },
    { label: 'Pendentes', value: String(pending), tone: '#FDE7C4' },
  ];
  return <ScrollView style={sharedStyles.screen} contentContainerStyle={styles.contentContainer}>
    <View style={sharedStyles.container}>
      <View style={styles.heroCard}>
        <Text style={styles.greeting}>{'Olá!'}</Text>
        <Text style={styles.subtext}>Sua rotina escolar organizada, em um só lugar.</Text>
        <View style={styles.quickActions}>
          <TouchableOpacity style={[sharedStyles.primaryButton, styles.actionButton]} onPress={() => navigation.navigate('Tasks')}><Text style={sharedStyles.primaryButtonText}>Ver tarefas</Text></TouchableOpacity>
          <TouchableOpacity style={[sharedStyles.secondaryButton, styles.actionButton]} onPress={() => navigation.navigate('Subjects')}><Text style={sharedStyles.secondaryButtonText}>{'Matérias'}</Text></TouchableOpacity>
        </View>
      </View>
      <Text style={sharedStyles.sectionTitle}>Resumo</Text>
      {loading && <ActivityIndicator color={palette.bordo} style={styles.loading} />}
      {!TEST_USER_ID && <Text style={styles.message}>Defina EXPO_PUBLIC_TEST_USER_ID em .env.local para usar a API.</Text>}
      {!!error && <Text style={styles.error}>{error}</Text>}
      <View style={styles.statsRow}>{stats.map((stat) => <StatCard key={stat.label} label={stat.label} value={stat.value} tone={stat.tone} />)}</View>
      <Text style={sharedStyles.sectionTitle}>{'Próximas atividades'}</Text>
      {!loading && !error && !!TEST_USER_ID && upcoming.length === 0 && <Text style={styles.message}>Nenhuma atividade pendente no momento.</Text>}
      <View style={styles.taskList}>{upcoming.map((task) => <TaskItem key={task.id} task={task} />)}</View>
    </View>
  </ScrollView>;
}
const styles = StyleSheet.create({
  contentContainer: { flexGrow: 1 },
  heroCard: { backgroundColor: '#FFF8FB', borderRadius: 24, padding: 22, marginBottom: 24, borderWidth: 1, borderColor: '#F2D7E3', shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.08, shadowRadius: 12, elevation: 4 },
  greeting: { fontSize: 28, fontWeight: '800', color: palette.bordoEscuro, marginBottom: 8 },
  subtext: { fontSize: 15, lineHeight: 22, color: palette.cinzaMedio, marginBottom: 18 },
  quickActions: { flexDirection: 'row', alignItems: 'center' }, actionButton: { flex: 1, marginRight: 12 },
  statsRow: { flexDirection: 'row', marginBottom: 24, marginTop: 4 }, taskList: { marginTop: 4 },
  loading: { marginVertical: 12 }, message: { color: palette.cinzaMedio, fontSize: 14, marginBottom: 12 },
  error: { color: palette.vermelho, fontSize: 14, marginBottom: 12 },
});
