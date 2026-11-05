import React from 'react';
import { ActivityIndicator, Modal, ScrollView, Text, TouchableOpacity, View, StyleSheet } from 'react-native';
import { palette } from '../styles/theme';
export default function FormModal({ visible, title, onClose, onSubmit, submitLabel, submitting, error, children }) {
  return <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
    <View style={styles.overlay}><View style={styles.card}>
      <Text style={styles.title}>{title}</Text>
      <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.content}>
        {children}{!!error && <Text style={styles.error}>{error}</Text>}
        <View style={styles.actions}>
          <TouchableOpacity style={[styles.button, styles.cancel]} onPress={onClose} disabled={submitting}><Text style={styles.cancelText}>Cancelar</Text></TouchableOpacity>
          <TouchableOpacity style={[styles.button, styles.submit, submitting && styles.disabled]} onPress={onSubmit} disabled={submitting}>
            {submitting ? <ActivityIndicator color={palette.branco} /> : <Text style={styles.submitText}>{submitLabel}</Text>}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View></View>
  </Modal>;
}
const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 16, backgroundColor: 'rgba(35,12,26,0.48)' },
  card: { width: '100%', maxWidth: 560, maxHeight: '92%', overflow: 'hidden', borderRadius: 22, backgroundColor: palette.branco, paddingTop: 22 },
  title: { paddingHorizontal: 22, marginBottom: 12, color: palette.bordoEscuro, fontSize: 22, fontWeight: '800' },
  content: { paddingHorizontal: 22, paddingBottom: 22 }, error: { marginTop: 12, color: palette.vermelho, fontSize: 14 },
  actions: { flexDirection: 'row', justifyContent: 'flex-end', marginTop: 20 },
  button: { minWidth: 110, minHeight: 44, alignItems: 'center', justifyContent: 'center', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10, marginLeft: 10 },
  cancel: { backgroundColor: palette.rosaSuave }, cancelText: { color: palette.bordo, fontWeight: '700' },
  submit: { backgroundColor: palette.bordo }, submitText: { color: palette.branco, fontWeight: '700' }, disabled: { opacity: 0.6 },
});
