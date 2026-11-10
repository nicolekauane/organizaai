import React, { useCallback, useRef, useState } from 'react';
import { ActivityIndicator, ScrollView, Text, TextInput, TouchableOpacity, View, StyleSheet, Platform } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import FormModal from '../components/FormModal';
import SubjectItem from '../components/SubjectItem';
import { consultarMaterias, criarMateria, atualizarMateria, excluirMateria } from '../services/materiasService';
import { consultarTarefas } from '../services/tarefasService';
import { mapSubjectForDisplay } from '../utils/dataMappers';
import { confirmAction } from '../utils/confirmAction';
import { useAuth } from '../context/AuthContext';
import { palette, sharedStyles } from '../styles/theme';

const colors = [
  '#F8BBD0', '#E9A9C2', '#D81B60', '#AD1457', '#5D1C39',
  '#EF5350', '#C62828', '#FF9800', '#F57C00', '#FFEB3B',
  '#F9A825', '#C5E1A5', '#66BB6A', '#2E7D32', '#A5D6A7',
  '#81D4FA', '#8DB5D8', '#1976D2', '#0D47A1', '#80CBC4',
  '#26A69A', '#CE93D8', '#AB47BC', '#6A1B9A', '#BCAAA4',
  '#795548', '#BDBDBD', '#616161', '#FFFFFF', '#263238',
];
const emptyForm = { nome: '', professor: '', cor: '#E9A9C2' };
function getSwatchCheckColor(hex) {
  const channels = hex.slice(1).match(/.{2}/g).map((channel) => parseInt(channel, 16));
  const luminance = (channels[0] * 299 + channels[1] * 587 + channels[2] * 114) / 1000;
  return luminance > 150 ? palette.bordoEscuro : palette.branco;
}
function Field({ label, ...props }) {
  return <View style={styles.field}><Text style={styles.fieldLabel}>{label}</Text><TextInput {...props} style={styles.input} placeholderTextColor={palette.cinzaMedio} /></View>;
}

export default function SubjectsScreen() {
  const { user } = useAuth();
  const [subjects, setSubjects] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [visible, setVisible] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [formError, setFormError] = useState(null);
  const [saving, setSaving] = useState(false);
  const [busyId, setBusyId] = useState(null);
  const actionLock = useRef(false);

  useFocusEffect(useCallback(() => {
    let active = true;
    if (!user) {
      setSubjects([]); setTasks([]); setError(null); setLoading(false);
      return () => { active = false; };
    }
    setLoading(true); setError(null);
    Promise.all([consultarMaterias(), consultarTarefas()])
      .then(([nextSubjects, nextTasks]) => { if (active) { setSubjects(nextSubjects); setTasks(nextTasks); } })
      .catch((e) => { if (active) setError(e.message || 'Não foi possível carregar as matérias.'); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- Refresh key deliberately reloads after mutations.
  }, [refreshKey, user]));

  function openNew() { setEditing(null); setForm(emptyForm); setFormError(null); setVisible(true); }
  function openEdit(subject) {
    setEditing(subject); setForm({ nome: subject.nome || '', professor: subject.professor || '', cor: subject.cor || emptyForm.cor });
    setFormError(null); setVisible(true);
  }
  async function save() {
    if (!user || saving) return;
    const nome = form.nome.trim(), professor = form.professor.trim(), cor = form.cor.trim();
    if (!nome) { setFormError('Informe o nome da matéria.'); return; }
    if (nome.length > 100) { setFormError('O nome aceita até 100 caracteres.'); return; }
    if (professor.length > 100) { setFormError('O nome do professor aceita até 100 caracteres.'); return; }
    if (cor && !/^#[0-9A-Fa-f]{6}$/.test(cor)) { setFormError('Use uma cor hexadecimal no formato #RRGGBB.'); return; }
    setSaving(true); setFormError(null);
    try {
      const data = { nome, professor: professor || null, cor: cor || null };
      if (editing) await atualizarMateria(editing.id, data);
      else await criarMateria(data);
      setVisible(false); setRefreshKey((key) => key + 1);
    } catch (e) { setFormError(e.message || 'Não foi possível salvar a matéria.'); }
    finally { setSaving(false); }
  }
  async function remove(subject) {
    if (actionLock.current) return;
    actionLock.current = true;
    const ok = await confirmAction('Excluir matéria', 'Deseja excluir "' + subject.nome + '"? As tarefas relacionadas continuarão sem essa matéria.');
    if (!ok) { actionLock.current = false; return; }
    setBusyId(String(subject.id)); setError(null);
    try { await excluirMateria(subject.id); setRefreshKey((key) => key + 1); }
    catch (e) { setError(e.message || 'Não foi possível excluir a matéria.'); }
    finally { actionLock.current = false; setBusyId(null); }
  }

  return <ScrollView style={sharedStyles.screen} contentContainerStyle={styles.contentContainer}>
    <View style={sharedStyles.container}>
      <View style={styles.headerRow}>
        <Text style={sharedStyles.title}>{'Matérias'}</Text>
        <TouchableOpacity style={sharedStyles.secondaryButton} onPress={() => router.navigate('/')}><Text style={sharedStyles.secondaryButtonText}>{'Início'}</Text></TouchableOpacity>
      </View>
      <TouchableOpacity style={[sharedStyles.primaryButton, styles.newButton]} onPress={openNew} disabled={!user || !!busyId}><Text style={sharedStyles.primaryButtonText}>{'+ Nova matéria'}</Text></TouchableOpacity>
      <Text style={styles.summary}>Acompanhe o andamento das suas disciplinas.</Text>
      {loading && <ActivityIndicator color={palette.bordo} style={styles.loading} />}
      {!!error && <View><Text style={styles.errorMessage}>{error}</Text><TouchableOpacity onPress={() => setRefreshKey((key) => key + 1)}><Text style={styles.retry}>Tentar novamente</Text></TouchableOpacity></View>}
      {!loading && !error && !!user && subjects.length === 0 && <Text style={styles.stateMessage}>Nenhuma matéria encontrada. Cadastre a primeira.</Text>}
      {subjects.map((subject) => <View key={subject.id} style={busyId === String(subject.id) && styles.busy} pointerEvents={busyId ? 'none' : 'auto'}>
        <SubjectItem subject={mapSubjectForDisplay(subject, tasks)} onEdit={() => openEdit(subject)} onDelete={() => remove(subject)} />
        {busyId === String(subject.id) && <ActivityIndicator color={palette.bordo} />}
      </View>)}
      <TouchableOpacity style={sharedStyles.secondaryButton} onPress={() => router.navigate('/tarefas')}><Text style={sharedStyles.secondaryButtonText}>Ver tarefas</Text></TouchableOpacity>
    </View>
    <FormModal visible={visible} title={editing ? 'Editar matéria' : 'Nova matéria'} onClose={() => !saving && setVisible(false)} onSubmit={save} submitLabel={editing ? 'Salvar alterações' : 'Cadastrar matéria'} submitting={saving} error={formError}>
      <Field label="Nome *" value={form.nome} onChangeText={(nome) => setForm({ ...form, nome })} maxLength={100} placeholder="Ex.: Matemática" autoCapitalize="words" />
      <Field label="Professor (opcional)" value={form.professor} onChangeText={(professor) => setForm({ ...form, professor })} maxLength={100} placeholder="Nome do professor" autoCapitalize="words" />
      <Text style={styles.fieldLabel}>Escolha uma cor</Text>
      <View style={styles.swatches}>{colors.map((color) => {
        const selected = form.cor.toUpperCase() === color;
        return <TouchableOpacity key={color} onPress={() => setForm({ ...form, cor: color })} style={[styles.swatch, { backgroundColor: color }, selected && styles.swatchSelected]} accessibilityRole="button" accessibilityLabel={'Selecionar cor ' + color} accessibilityState={{ selected }}>
          {selected && <Text style={[styles.swatchCheck, { color: getSwatchCheckColor(color) }]}>✓</Text>}
        </TouchableOpacity>;
      })}</View>
      <Text style={styles.fieldLabel}>Cor personalizada</Text>
      {Platform.OS === 'web' ? <View style={styles.nativePickerRow}>
        <Text style={styles.helperText}>Escolha qualquer cor no seletor:</Text>
        {React.createElement('input', { type: 'color', value: /^#[0-9A-Fa-f]{6}$/.test(form.cor) ? form.cor : emptyForm.cor, onChange: (event) => setForm({ ...form, cor: event.target.value.toUpperCase() }), 'aria-label': 'Escolher cor personalizada', style: { width: 48, height: 40, padding: 2, border: '1px solid #E4CBD6', borderRadius: 8, background: '#FFFCFD', cursor: 'pointer' } })}
      </View> : <Text style={styles.helperText}>No celular, informe o hexadecimal abaixo ou escolha uma cor sugerida.</Text>}
      <Field label="Código hexadecimal" value={form.cor} onChangeText={(cor) => setForm({ ...form, cor: cor.toUpperCase() })} maxLength={7} placeholder="#E9A9C2" autoCapitalize="characters" autoCorrect={false} />
      <View style={styles.previewRow}><View style={[styles.previewSwatch, { backgroundColor: /^#[0-9A-Fa-f]{6}$/.test(form.cor) ? form.cor : palette.branco }]} /><Text style={styles.previewText}>Prévia: {form.cor || 'nenhuma cor'}</Text></View>
    </FormModal>
  </ScrollView>;
}
const styles = StyleSheet.create({
  contentContainer: { flexGrow: 1 }, headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  newButton: { alignSelf: 'flex-start', marginBottom: 14 }, summary: { fontSize: 14, color: palette.cinzaMedio, marginBottom: 18 },
  loading: { marginVertical: 14 }, stateMessage: { fontSize: 14, color: palette.cinzaMedio, marginBottom: 16 },
  errorMessage: { color: palette.vermelho, fontSize: 14, marginBottom: 8 }, retry: { color: palette.bordo, fontWeight: '700', marginBottom: 16 }, busy: { opacity: 0.55 },
  field: { marginBottom: 14 }, fieldLabel: { color: palette.texto, fontSize: 14, fontWeight: '700', marginBottom: 7 },
  input: { minHeight: 44, borderWidth: 1, borderColor: '#E4CBD6', borderRadius: 11, paddingHorizontal: 12, paddingVertical: 10, color: palette.texto, backgroundColor: '#FFFCFD', fontSize: 15 },
  swatches: { flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: -5 }, swatch: { width: 34, height: 34, borderRadius: 17, margin: 5, borderWidth: 2, borderColor: palette.branco },
  swatchSelected: { borderColor: palette.bordoEscuro, transform: [{ scale: 1.12 }], alignItems: 'center', justifyContent: 'center' },
  swatchCheck: { fontSize: 18, lineHeight: 22, fontWeight: '900' },
  helperText: { color: palette.cinzaMedio, fontSize: 13, marginBottom: 8 }, nativePickerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  previewRow: { flexDirection: 'row', alignItems: 'center', marginTop: 2 }, previewSwatch: { width: 26, height: 26, borderRadius: 13, borderColor: '#9A8290', borderWidth: 1, marginRight: 9 }, previewText: { color: palette.texto, fontWeight: '600', fontSize: 14 },
});
