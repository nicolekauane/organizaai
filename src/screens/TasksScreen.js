import React from 'react';
import { ScrollView, View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import TaskItem from '../components/TaskItem';
import { taskList } from '../services/mockData';
import { palette, sharedStyles } from '../styles/theme';

export default function TasksScreen({ navigation }) {
  return (
    <ScrollView style={sharedStyles.screen} contentContainerStyle={styles.contentContainer}>
      <View style={sharedStyles.container}>
        <View style={styles.headerRow}>
          <Text style={sharedStyles.title}>Tarefas</Text>
          <TouchableOpacity style={sharedStyles.secondaryButton} onPress={() => navigation.navigate('Home')}>
            <Text style={sharedStyles.secondaryButtonText}>Início</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.summary}>Você tem 4 atividades nesta semana.</Text>

        {taskList.map((task) => (
          <TaskItem key={task.id} task={task} />
        ))}

        <TouchableOpacity style={sharedStyles.primaryButton} onPress={() => navigation.navigate('Subjects')}>
          <Text style={sharedStyles.primaryButtonText}>Ver matérias</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  contentContainer: {
    flexGrow: 1,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  summary: {
    fontSize: 14,
    color: palette.cinzaMedio,
    marginBottom: 18,
  },
});
