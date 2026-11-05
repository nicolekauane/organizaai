import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { palette } from '../styles/theme';
export default function SubjectItem({ subject, onEdit, onDelete }) {
  return <View style={styles.card}>
    <View style={styles.headerRow}><View style={[styles.colorTag, { backgroundColor: subject.color || palette.rosaSuave }]} /><Text style={styles.subjectName}>{subject.name}</Text><Text style={styles.tasksCount}>{subject.tasks} tarefas</Text></View>
    <Text style={styles.teacher}>{subject.teacher}</Text>
    <View style={styles.progressBarBackground}><View style={[styles.progressBarFill, { width: subject.progress + '%', backgroundColor: subject.color || palette.rosa }]} /></View>
    <View style={styles.progressLabelRow}><Text style={styles.progressText}>Progresso</Text><Text style={styles.progressValue}>{subject.progress}%</Text></View>
    {(onEdit || onDelete) && <View style={styles.actions}>
      {onEdit && <TouchableOpacity style={styles.action} onPress={onEdit} accessibilityRole="button"><Text style={styles.actionText}>Editar</Text></TouchableOpacity>}
      {onDelete && <TouchableOpacity style={[styles.action, styles.delete]} onPress={onDelete} accessibilityRole="button"><Text style={styles.deleteText}>Excluir</Text></TouchableOpacity>}
    </View>}
  </View>;
}
const styles = StyleSheet.create({
  card: { backgroundColor: palette.branco, borderRadius: 16, padding: 16, marginBottom: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
  headerRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 }, colorTag: { width: 12, height: 12, borderRadius: 6, marginRight: 10 },
  subjectName: { flex: 1, fontSize: 16, fontWeight: '700', color: palette.texto }, tasksCount: { fontSize: 12, color: palette.cinzaMedio, marginLeft: 8 },
  teacher: { fontSize: 13, color: palette.cinzaMedio, marginBottom: 12 }, progressBarBackground: { height: 10, backgroundColor: '#F1E8ED', borderRadius: 999, overflow: 'hidden' },
  progressBarFill: { height: '100%', borderRadius: 999 }, progressLabelRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 10 },
  progressText: { fontSize: 12, color: palette.cinzaMedio }, progressValue: { fontSize: 12, fontWeight: '700', color: palette.bordo },
  actions: { flexDirection: 'row', justifyContent: 'flex-end', marginTop: 14, marginHorizontal: -4 },
  action: { minHeight: 36, justifyContent: 'center', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8, marginHorizontal: 4, backgroundColor: palette.rosaSuave },
  actionText: { color: palette.bordo, fontSize: 12, fontWeight: '700' }, delete: { backgroundColor: '#FBE5E5' }, deleteText: { color: palette.vermelho, fontSize: 12, fontWeight: '700' },
});
