import React, { useState } from 'react';
import { Text, TextInput, View } from 'react-native';
import { router } from 'expo-router';
import { carregarAreaResponsavel, solicitarAcompanhamento } from '../services/acompanhamentoService';
import { usePrivateResource } from '../hooks/usePrivateResource';
import { usePrivateAction } from '../hooks/usePrivateAction';
import { FollowPage, ActionButton, LinkCard, styles } from '../components/FollowUI';
import { palette, sharedStyles } from '../styles/theme';
export default function GuardianScreen() {
  const [email, setEmail] = useState('');
  const { data, loading, error, reload } = usePrivateResource(carregarAreaResponsavel, 'responsavel');
  const action = usePrivateAction();
  const submit = () => { void action.run(async valid => {
    const result = await solicitarAcompanhamento(email);
    if (!valid()) return '';
    setEmail(''); await reload();
    return result.message;
  }); };
  return <FollowPage title="Alunos acompanhados" subtitle="Acompanhe a rotina escolar dos alunos que autorizaram seu acesso." loading={loading} error={error || action.error} reload={reload} busy={action.busy}>
    <View style={[sharedStyles.card, styles.card]}>
      <Text accessibilityRole="header" style={sharedStyles.sectionTitle}>Solicitar acompanhamento</Text>
      <Text style={styles.label}>E-mail do aluno</Text>
      <TextInput accessibilityLabel="E-mail do aluno" value={email} onChangeText={setEmail} editable={!action.busy} placeholder="aluno@exemplo.com" placeholderTextColor={palette.cinzaMedio} autoCapitalize="none" autoCorrect={false} keyboardType="email-address" autoComplete="email" maxLength={150} style={styles.input} onSubmitEditing={submit} />
      <Text style={styles.hint}>O acesso depende da aprovação do aluno. Uma solicitação recusada ou revogada só pode ser renovada após 24 horas do encerramento e precisa de nova aprovação.</Text>
      <ActionButton title={action.busy ? 'Enviando…' : 'Enviar solicitação'} disabled={action.busy} onPress={submit} />
      {!!action.message && <Text accessibilityRole="alert" style={styles.message}>{action.message}</Text>}
    </View>
    {data && !loading && <>
      <View style={styles.section}><Text accessibilityRole="header" style={sharedStyles.sectionTitle}>Acesso autorizado</Text>
        {data.alunos.length === 0 && <Text style={styles.message}>Nenhum aluno autorizou seu acompanhamento ainda.</Text>}
        {data.alunos.map(aluno => <View key={aluno.id} style={[sharedStyles.card, styles.card]}>
          <Text style={sharedStyles.sectionTitle}>{aluno.nome}</Text>
          <Text style={styles.hint}>Matérias, tarefas e progresso em modo de leitura.</Text>
          <ActionButton title="Ver acompanhamento" onPress={() => router.navigate({ pathname: '/acompanhamento/[alunoId]', params: { alunoId: String(aluno.id) } })} />
        </View>)}
      </View>
      <View style={styles.section}><Text accessibilityRole="header" style={sharedStyles.sectionTitle}>Solicitações e vínculos</Text>
        {data.vinculos.length === 0 && <Text style={styles.message}>Nenhum vínculo disponível para sua conta.</Text>}
        {data.vinculos.map(link => <LinkCard key={link.id} link={link} />)}
      </View>
    </>}
  </FollowPage>;
}
