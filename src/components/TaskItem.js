import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { palette } from '../styles/theme';

export default function TaskItem({ task }) {
  const priorityColors = {
    Alta: '#D7787A',
    Média: '#F4C76A',
    Baixa: '#78B89A',
  };

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={[styles.subjectBadge, { backgroundColor: task.color || palette.rosaSuave }]}>
          <Text style={styles.subjectText}>{task.subject}</Text>
        </View>
        <View style={[styles.priorityBadge, { backgroundColor: `${priorityColors[task.priority] || '#F6D4E2'}22` }]}>
          <Text style={[styles.priorityText, { color: priorityColors[task.priority] || palette.bordo }]}>{task.priority}</Text>
        </View>
      </View>

      <Text style={styles.title}>{task.title}</Text>

      <View style={styles.metaRow}>
        <Text style={styles.meta}>{task.due}</Text>
        <Text style={styles.meta}>{task.status}</Text>
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
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  subjectBadge: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  subjectText: {
    fontSize: 11,
    color: palette.bordoEscuro,
    fontWeight: '700',
  },
  priorityBadge: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  priorityText: {
    fontSize: 11,
    fontWeight: '700',
  },
  title: {
    color: palette.texto,
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 12,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  meta: {
    fontSize: 12,
    color: palette.cinzaMedio,
  },
});
