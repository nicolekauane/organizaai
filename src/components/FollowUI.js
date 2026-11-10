import React from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { palette, sharedStyles } from '../styles/theme';
export const statusLabels = { pendente: 'Pendente', autorizado: 'Autorizado', recusado: 'Recusado', revogado: 'Revogado' };
export function ActionButton({ title, onPress, disabled = false, secondary = false }) {
  return <TouchableOpacity accessibilityRole="button" accessibilityState={{ disabled }} disabled={disabled} onPress={onPress} style={[secondary ? sharedStyles.secondaryButton : sharedStyles.primaryButton, styles.button, disabled && styles.disabled]}>
    <Text style={secondary ? sharedStyles.secondaryButtonText : sharedStyles.primaryButtonText}>{title}</Text>
  </TouchableOpacity>;
}
export function FollowPage({ title, subtitle, children, loading, error, reload, busy = false }) {
  return <ScrollView style={sharedStyles.screen} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
    <View style={styles.container}>
      <Text accessibilityRole="header" style={sharedStyles.title}>{title}</Text>
      {!!subtitle && <Text style={styles.hint}>{subtitle}</Text>}
      <ActionButton title={loading ? 'Atualizando…' : 'Atualizar'} secondary onPress={reload} disabled={loading || busy} />
      {loading && <ActivityIndicator color={palette.bordo} accessibilityLabel="Carregando" style={styles.space} />}
      {!!error && <Text accessibilityRole="alert" style={styles.error}>{error}</Text>}
      {children}
    </View>
  </ScrollView>;
}
export function LinkCard({ link, student = false, children }) {
  return <View style={[sharedStyles.card, styles.card]}>
    <Text style={sharedStyles.sectionTitle}>{student ? link.responsavel_nome : link.aluno_nome}</Text>
    <Text style={styles.badge}>{statusLabels[link.status] || 'Indisponível'}</Text>
    <Text style={styles.hint}>Solicitado em {formatLinkDate(link.solicitado_em)}</Text>
    {!!link.autorizado_em && <Text style={styles.hint}>Autorizado em {formatLinkDate(link.autorizado_em)}</Text>}
    {!!link.encerrado_em && <Text style={styles.hint}>Encerrado em {formatLinkDate(link.encerrado_em)}</Text>}
    {children}
  </View>;
}
const formatLinkDate = value => { const [date, time] = String(value || '').split(' '); return date ? date.split('-').reverse().join('/') + (time ? ' às ' + time.slice(0, 5) : '') : 'Não informado'; };
export const styles = StyleSheet.create({
  content: { flexGrow: 1, alignItems: 'center' },
  container: { width: '100%', maxWidth: 960, padding: 20, paddingBottom: 40 },
  card: { marginTop: 16 }, space: { marginVertical: 16 },
  hint: { color: palette.cinzaMedio, fontSize: 14, lineHeight: 22, marginVertical: 6 },
  message: { color: palette.bordo, fontSize: 15, lineHeight: 23, marginVertical: 12 },
  error: { color: palette.bordoEscuro, backgroundColor: palette.rosaSuave, borderRadius: 12, padding: 12, marginVertical: 12 },
  button: { minHeight: 48, marginVertical: 6 }, disabled: { opacity: 0.6 },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 }, action: { minWidth: 120, flexGrow: 1 },
  badge: { alignSelf: 'flex-start', backgroundColor: palette.rosaSuave, color: palette.bordo, fontWeight: '700', paddingVertical: 6, paddingHorizontal: 12, borderRadius: 12, overflow: 'hidden' },
  input: { minHeight: 48, backgroundColor: '#FFFCFD', borderWidth: 1, borderColor: '#E4CBD6', borderRadius: 12, padding: 12, color: palette.texto, fontSize: 16 },
  label: { color: palette.texto, fontWeight: '600', marginBottom: 8 },
  stats: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginVertical: 12 }, stat: { minWidth: 130, flexGrow: 1, flexBasis: '40%' },
  section: { marginTop: 24 }, description: { color: palette.texto, lineHeight: 22, marginBottom: 12, paddingHorizontal: 4 },
});
