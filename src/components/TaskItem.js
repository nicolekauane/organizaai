import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { palette } from '../styles/theme';
export default function TaskItem({ task, onEdit, onDelete, onToggleComplete }) {
  const colors = { Alta: '#D7787A', 'Média': '#F4C76A', Baixa: '#78B89A' };
  const actions = onEdit || onDelete || onToggleComplete;
  return <View style={styles.card}>
    <View style={styles.header}>
      <View style={[styles.subjectBadge, { backgroundColor: task.color || palette.rosaSuave }]}><Text style={styles.subjectText}>{task.subject}</Text></View>
      <View style={[styles.priorityBadge, { backgroundColor: (colors[task.priority] || '#F6D4E2') + '22' }]}><Text style={[styles.priorityText, { color: colors[task.priority] || palette.bordo }]}>{task.priority}</Text></View>
    </View>
    <Text style={styles.title}>{task.title}</Text>
    <View style={styles.metaRow}><Text style={styles.meta}>{task.due}</Text><Text style={styles.meta}>{task.status}</Text></View>
    {!!actions && <View style={styles.actions}>
      {onToggleComplete && <TouchableOpacity style={[styles.action, styles.complete]} onPress={onToggleComplete} accessibilityRole="button"><Text style={styles.completeText}>{task.isCompleted ? 'Reabrir' : 'Concluir'}</Text></TouchableOpacity>}
      {onEdit && <TouchableOpacity style={styles.action} onPress={onEdit} accessibilityRole="button"><Text style={styles.actionText}>Editar</Text></TouchableOpacity>}
      {onDelete && <TouchableOpacity style={[styles.action, styles.delete]} onPress={onDelete} accessibilityRole="button"><Text style={styles.deleteText}>Excluir</Text></TouchableOpacity>}
    </View>}
  </View>;
}
const styles = StyleSheet.create({
  card: { backgroundColor: palette.branco, borderRadius: 16, padding: 16, marginBottom: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 2 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 },
  subjectBadge: { borderRadius: 999, paddingHorizontal: 10, paddingVertical: 6 }, subjectText: { fontSize: 11, color: palette.bordoEscuro, fontWeight: '700' },
  priorityBadge: { borderRadius: 999, paddingHorizontal: 10, paddingVertical: 6 }, priorityText: { fontSize: 11, fontWeight: '700' },
  title: { color: palette.texto, fontSize: 16, fontWeight: '700', marginBottom: 12 },
  metaRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }, meta: { fontSize: 12, color: palette.cinzaMedio },
  actions: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'flex-end', marginTop: 14, marginHorizontal: -4 },
  action: { minHeight: 36, justifyContent: 'center', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8, marginHorizontal: 4, marginTop: 4, backgroundColor: palette.rosaSuave },
  actionText: { color: palette.bordo, fontSize: 12, fontWeight: '700' }, complete: { backgroundColor: '#D7F0E2' },
  completeText: { color: '#286044', fontSize: 12, fontWeight: '700' }, delete: { backgroundColor: '#FBE5E5' },
  deleteText: { color: palette.vermelho, fontSize: 12, fontWeight: '700' },
});
