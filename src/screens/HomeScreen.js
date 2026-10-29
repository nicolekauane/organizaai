import React from 'react';
import { ScrollView, View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import StatCard from '../components/StatCard';
import TaskItem from '../components/TaskItem';
import { dashboardStats, taskList } from '../services/mockData';
import { palette, sharedStyles } from '../styles/theme';

export default function HomeScreen({ navigation }) {
  const upcomingTasks = taskList.slice(0, 2);

  return (
    <ScrollView style={sharedStyles.screen} contentContainerStyle={styles.contentContainer}>
      <View style={sharedStyles.container}>
        <View style={styles.heroCard}>
          <Text style={styles.greeting}>Olá, Ana!</Text>
          <Text style={styles.subtext}>Seu plano escolar está organizado e pronto para a semana.</Text>

          <View style={styles.quickActions}>
            <TouchableOpacity style={[sharedStyles.primaryButton, styles.actionButton]} onPress={() => navigation.navigate('Tasks')}>
              <Text style={sharedStyles.primaryButtonText}>Ver tarefas</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[sharedStyles.secondaryButton, styles.actionButton]} onPress={() => navigation.navigate('Subjects')}>
              <Text style={sharedStyles.secondaryButtonText}>Matérias</Text>
            </TouchableOpacity>
          </View>
        </View>

        <Text style={sharedStyles.sectionTitle}>Resumo</Text>
        <View style={styles.statsRow}>
          {dashboardStats.map((stat) => (
            <StatCard key={stat.label} label={stat.label} value={stat.value} tone={stat.tone} />
          ))}
        </View>

        <Text style={sharedStyles.sectionTitle}>Próximas atividades</Text>
        <View style={styles.taskList}>
          {upcomingTasks.map((task) => (
            <TaskItem key={task.id} task={task} />
          ))}
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  contentContainer: {
    flexGrow: 1,
  },
  heroCard: {
    backgroundColor: '#FFF8FB',
    borderRadius: 24,
    padding: 22,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#F2D7E3',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  greeting: {
    fontSize: 28,
    fontWeight: '800',
    color: palette.bordoEscuro,
    marginBottom: 8,
  },
  subtext: {
    fontSize: 15,
    lineHeight: 22,
    color: palette.cinzaMedio,
    marginBottom: 18,
  },
  quickActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionButton: {
    flex: 1,
    marginRight: 12,
  },
  statsRow: {
    flexDirection: 'row',
    marginBottom: 24,
    marginTop: 4,
  },
  taskList: {
    marginTop: 4,
  },
});
