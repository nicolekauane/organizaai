import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { palette } from '../styles/theme';

export default function SubjectItem({ subject }) {
  return (
    <View style={styles.card}>
      <View style={styles.headerRow}>
        <View style={[styles.colorTag, { backgroundColor: subject.color || palette.rosaSuave }]} />
        <Text style={styles.subjectName}>{subject.name}</Text>
        <Text style={styles.tasksCount}>{subject.tasks} tarefas</Text>
      </View>

      <Text style={styles.teacher}>{subject.teacher}</Text>

      <View style={styles.progressBarBackground}>
        <View style={[styles.progressBarFill, { width: `${subject.progress}%`, backgroundColor: subject.color || palette.rosa }]} />
      </View>

      <View style={styles.progressLabelRow}>
        <Text style={styles.progressText}>Progresso</Text>
        <Text style={styles.progressValue}>{subject.progress}%</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: palette.branco,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  colorTag: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 10,
  },
  subjectName: {
    flex: 1,
    fontSize: 16,
    fontWeight: '700',
    color: palette.texto,
  },
  tasksCount: {
    fontSize: 12,
    color: palette.cinzaMedio,
  },
  teacher: {
    fontSize: 13,
    color: palette.cinzaMedio,
    marginBottom: 12,
  },
  progressBarBackground: {
    height: 10,
    backgroundColor: '#F1E8ED',
    borderRadius: 999,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 999,
  },
  progressLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  progressText: {
    fontSize: 12,
    color: palette.cinzaMedio,
  },
  progressValue: {
    fontSize: 12,
    fontWeight: '700',
    color: palette.bordo,
  },
});
