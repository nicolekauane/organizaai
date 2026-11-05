import React, { useCallback, useRef, useState } from 'react';
import { ActivityIndicator, ScrollView, Text, TextInput, TouchableOpacity, View, StyleSheet } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import FormModal from '../components/FormModal';
import DatePickerField from '../components/DatePickerField';
import TaskItem from '../components/TaskItem';
import { consultarTarefas, criarTarefa, atualizarTarefa, excluirTarefa } from '../services/tarefasService';
import { consultarMaterias } from '../services/materiasService';
import { mapTaskForDisplay } from '../utils/dataMappers';
import { confirmAction } from '../utils/confirmAction';
import { TEST_USER_ID } from '../config/testUser';
import { palette, sharedStyles } from '../styles/theme';

const priorities = [{ value: 'baixa', label: 'Baixa' }, { value: 'media', label: 'Média' }, { value: 'alta', label: 'Alta' }];
const statuses = [{ value: 'pendente', label: 'Pendente' }, { value: 'em andamento', label: 'Em andamento' }, { value: 'concluida', label: 'Concluída' }];
const emptyForm = { titulo: '', descricao: '', data_entrega: '', prioridade: 'media', status: 'pendente', materia_id: '' };

function validDate(value) {
  if (!value) return true;
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return false;
  const date = new Date(Date.UTC(+match[1], +match[2] - 1, +match[3]));
  return date.getUTCFullYear() === +match[1] && date.getUTCMonth() === +match[2] - 1 && date.getUTCDate() === +match[3];
}
function Field({ label, ...props }) {
  return <View style={styles.field}><Text style={styles.fieldLabel}>{label}</Text><TextInput {...props} style={[styles.input, props.multiline && styles.multiline]} placeholderTextColor={palette.cinzaMedio} /></View>;
}
function Choices({ options, value, onChange }) {
  return <View style={styles.choices}>{options.map((item) => <TouchableOpacity key={item.value} onPress={() => onChange(item.value)} style={[styles.choice, value === item.value && styles.selected]} accessibilityRole="button" accessibilityState={{ selected: value === item.value }}><Text style={[styles.choiceText, value === item.value && styles.selectedText]}>{item.label}</Text></TouchableOpacity>)}</View>;
}

export default function TasksScreen({ navigation }) {
  const [tasks, setTasks] = useState([]);
  const [subjects, setSubjects] = useState([]);
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
    if (!TEST_USER_ID) {
      setTasks([]); setSubjects([]); setError(null); setLoading(false);
      return () => { active = false; };
    }
    setLoading(true); setError(null);
    Promise.all([consultarTarefas(TEST_USER_ID), consultarMaterias(TEST_USER_ID)])
      .then(([nextTasks, nextSubjects]) => { if (active) { setTasks(nextTasks); setSubjects(nextSubjects); } })
      .catch((e) => { if (active) setError(e.message || 'Não foi possível carregar as tarefas.'); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [refreshKey]));

  function openNew() { setEditing(null); setForm(emptyForm); setFormError(null); setVisible(true); }
  function openEdit(task) {
    setEditing(task);
    setForm({
      titulo: task.titulo || '', descricao: task.descricao || '',
      data_entrega: task.data_entrega ? String(task.data_entrega).slice(0, 10) : '',
      prioridade: task.prioridade || 'media', status: task.status || 'pendente',
      materia_id: task.materia_id == null ? '' : String(task.materia_id),
    });
    setFormError(null); setVisible(true);
  }
  async function save() {
    if (!TEST_USER_ID || saving) return;
    const title = form.titulo.trim();
    if (!title) { setFormError('Informe o título da tarefa.'); return; }
    if (title.length > 150) { setFormError('O título aceita até 150 caracteres.'); return; }
    const dueDate = form.data_entrega;
    if (!validDate(dueDate)) { setFormError('A data de entrega selecionada é inválida.'); return; }
    setSaving(true); setFormError(null);
    try {
      const data = {
        titulo: title, descricao: form.descricao.trim() || null, data_entrega: dueDate || null,
        prioridade: form.prioridade, status: form.status, materia_id: form.materia_id ? Number(form.materia_id) : null,
      };
      if (editing) await atualizarTarefa(editing.id, data, TEST_USER_ID);
      else await criarTarefa(data, TEST_USER_ID);
      setVisible(false); setRefreshKey((key) => key + 1);
    } catch (e) { setFormError(e.message || 'Não foi possível salvar a tarefa.'); }
    finally { setSaving(false); }
  }
  async function toggleComplete(task) {
    if (actionLock.current) return;
    actionLock.current = true;
    setBusyId(String(task.id));
    try {
      await atualizarTarefa(task.id, {
        titulo: task.titulo, descricao: task.descricao, data_entrega: task.data_entrega,
        prioridade: task.prioridade, status: task.status === 'concluida' ? 'pendente' : 'concluida',
        materia_id: task.materia_id,
      }, TEST_USER_ID);
      setRefreshKey((key) => key + 1);
    } catch (e) { setError(e.message || 'Não foi possível atualizar o status.'); }
    finally { actionLock.current = false; setBusyId(null); }
  }
  async function remove(task) {
    if (actionLock.current) return;
    actionLock.current = true;
    const ok = await confirmAction('Excluir tarefa', 'Deseja excluir "' + task.titulo + '"? Essa ação não pode ser desfeita.');
    if (!ok) { actionLock.current = false; return; }
    setBusyId(String(task.id)); setError(null);
    try { await excluirTarefa(task.id, TEST_USER_ID); setRefreshKey((key) => key + 1); }
    catch (e) { setError(e.message || 'Não foi possível excluir a tarefa.'); }
    finally { actionLock.current = false; setBusyId(null); }
  }

  function goToSubjects() {
    setVisible(false);
    navigation.navigate('Subjects');
  }

  const matterOptions = [{ value: '', label: 'Sem matéria' }, ...subjects.map((item) => ({ value: String(item.id), label: item.nome }))];

  return <ScrollView style={sharedStyles.screen} contentContainerStyle={styles.contentContainer}>
    <View style={sharedStyles.container}>
      <View style={styles.headerRow}>
        <Text style={sharedStyles.title}>Tarefas</Text>
        <TouchableOpacity style={sharedStyles.secondaryButton} onPress={() => navigation.navigate('Home')}><Text style={sharedStyles.secondaryButtonText}>Início</Text></TouchableOpacity>
      </View>
      <TouchableOpacity style={[sharedStyles.primaryButton, styles.newButton, (loading || !TEST_USER_ID) && styles.disabledButton]} onPress={openNew} disabled={!TEST_USER_ID || loading || !!busyId}><Text style={sharedStyles.primaryButtonText}>+ Nova tarefa</Text></TouchableOpacity>
      <Text style={styles.summary}>{!TEST_USER_ID ? 'Configure o usuário de teste para carregar suas tarefas.' : 'Você tem ' + tasks.length + (tasks.length === 1 ? ' tarefa cadastrada.' : ' tarefas cadastradas.')}</Text>
      {loading && <ActivityIndicator color={palette.bordo} style={styles.loading} />}
      {!TEST_USER_ID && <Text style={styles.stateMessage}>Defina EXPO_PUBLIC_TEST_USER_ID em .env.local para usar a API.</Text>}
      {!!error && <View><Text style={styles.errorMessage}>{error}</Text><TouchableOpacity onPress={() => setRefreshKey((key) => key + 1)}><Text style={styles.retry}>Tentar novamente</Text></TouchableOpacity></View>}
      {!loading && !error && !!TEST_USER_ID && tasks.length === 0 && <Text style={styles.stateMessage}>Nenhuma tarefa encontrada. Cadastre a primeira.</Text>}
      {tasks.map((task) => <View key={task.id} style={busyId === String(task.id) && styles.busy} pointerEvents={busyId ? 'none' : 'auto'}>
        <TaskItem task={mapTaskForDisplay(task, subjects)} onEdit={() => openEdit(task)} onDelete={() => remove(task)} onToggleComplete={() => toggleComplete(task)} />
        {busyId === String(task.id) && <ActivityIndicator color={palette.bordo} />}
      </View>)}
      <TouchableOpacity style={sharedStyles.secondaryButton} onPress={() => navigation.navigate('Subjects')}><Text style={sharedStyles.secondaryButtonText}>Ver matérias</Text></TouchableOpacity>
    </View>
    <FormModal visible={visible} title={editing ? 'Editar tarefa' : 'Nova tarefa'} onClose={() => !saving && setVisible(false)} onSubmit={save} submitLabel={editing ? 'Salvar alterações' : 'Cadastrar tarefa'} submitting={saving} error={formError}>
      <Field label="Título *" value={form.titulo} onChangeText={(titulo) => setForm({ ...form, titulo })} maxLength={150} placeholder="Ex.: Revisar exercícios" autoCapitalize="sentences" />
      <Field label="Descrição" value={form.descricao} onChangeText={(descricao) => setForm({ ...form, descricao })} placeholder="Detalhes opcionais" multiline maxLength={5000} />
      <DatePickerField value={form.data_entrega} onChange={(data_entrega) => setForm({ ...form, data_entrega })} />
      <Text style={styles.fieldLabel}>Prioridade</Text><Choices options={priorities} value={form.prioridade} onChange={(prioridade) => setForm({ ...form, prioridade })} />
      <Text style={styles.fieldLabel}>Status</Text><Choices options={statuses} value={form.status} onChange={(status) => setForm({ ...form, status })} />
      <Text style={styles.fieldLabel}>Matéria (opcional)</Text>
      {subjects.length > 0 ? (
        <Choices options={matterOptions} value={form.materia_id} onChange={(materia_id) => setForm({ ...form, materia_id })} />
      ) : loading ? (
        <View style={styles.matterHint}><ActivityIndicator size="small" color={palette.bordo} /><Text style={styles.helper}>Carregando matérias cadastradas...</Text></View>
      ) : error ? (
        <View style={styles.matterHint}><Text style={styles.helper}>Não foi possível carregar as matérias. Verifique a conexão e tente novamente.</Text></View>
      ) : (
        <View style={styles.matterHint}>
          <Text style={styles.helper}>Nenhuma matéria cadastrada para este usuário. Você pode salvar a tarefa sem vínculo ou cadastrar uma matéria primeiro.</Text>
          <TouchableOpacity style={styles.addMatterButton} onPress={goToSubjects} accessibilityRole="button"><Text style={styles.addMatterText}>Cadastrar matéria</Text></TouchableOpacity>
        </View>
      )}
    </FormModal>
  </ScrollView>;
}

const styles = StyleSheet.create({
  contentContainer: { flexGrow: 1 }, headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  newButton: { alignSelf: 'flex-start', marginBottom: 14 }, disabledButton: { opacity: 0.55 },
  summary: { fontSize: 14, color: palette.cinzaMedio, marginBottom: 18 },
  loading: { marginVertical: 14 }, stateMessage: { fontSize: 14, color: palette.cinzaMedio, marginBottom: 16 },
  errorMessage: { color: palette.vermelho, fontSize: 14, marginBottom: 8 }, retry: { color: palette.bordo, fontWeight: '700', marginBottom: 16 }, busy: { opacity: 0.55 },
  field: { marginBottom: 14 }, fieldLabel: { color: palette.texto, fontSize: 14, fontWeight: '700', marginBottom: 7 },
  input: { minHeight: 44, borderWidth: 1, borderColor: '#E4CBD6', borderRadius: 11, paddingHorizontal: 12, paddingVertical: 10, color: palette.texto, backgroundColor: '#FFFCFD', fontSize: 15 },
  multiline: { minHeight: 86, textAlignVertical: 'top' }, choices: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 14, marginHorizontal: -4 },
  choice: { borderWidth: 1, borderColor: '#E4CBD6', borderRadius: 999, paddingHorizontal: 12, paddingVertical: 8, margin: 4, backgroundColor: palette.branco },
  selected: { borderColor: palette.bordo, backgroundColor: palette.rosaSuave }, choiceText: { color: palette.texto, fontSize: 13 },
  selectedText: { color: palette.bordo, fontWeight: '700' }, helper: { color: palette.cinzaMedio, fontSize: 13, lineHeight: 19 },
  matterHint: { marginBottom: 14 }, addMatterButton: { alignSelf: 'flex-start', marginTop: 10, paddingVertical: 8, paddingHorizontal: 12, backgroundColor: palette.rosaSuave, borderRadius: 10 },
  addMatterText: { color: palette.bordo, fontSize: 13, fontWeight: '700' },
});
