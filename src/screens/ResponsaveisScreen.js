import React from 'react';
import { Text, View } from 'react-native';
import { router } from 'expo-router';
import { consultarVinculos, decidirVinculo } from '../services/acompanhamentoService';
import { usePrivateResource } from '../hooks/usePrivateResource';
import { usePrivateAction } from '../hooks/usePrivateAction';
import { confirmAction } from '../utils/confirmAction';
import { FollowPage, ActionButton, LinkCard, styles } from '../components/FollowUI';
import { sharedStyles } from '../styles/theme';
export default function ResponsaveisScreen() {
  const { data, loading, error, reload, resource } = usePrivateResource(consultarVinculos, 'aluno');
  const action = usePrivateAction();
  function decide(link, decision) {
    void action.run(async valid => {
      if (decision === 'revogar' && !await confirmAction('Revogar acompanhamento?', 'Este responsável deixará de acessar suas matérias e tarefas. Uma nova solicitação precisará da sua aprovação.', 'Revogar')) return '';
      if (!valid()) return '';
      const current = resource.getSnapshot().data?.find(item => item.id === link.id);
      if (!current || current.solicitado_em !== link.solicitado_em || current.status !== link.status) { await reload(); throw new Error('A lista mudou. Confira o vínculo e confirme novamente.'); }
      try { await decidirVinculo(link, decision); }
      catch (e) {
        if ([409, 503].includes(e.status)) { await reload(); throw new Error('O vínculo pode ter mudado. A lista foi atualizada; confira antes de tentar novamente.'); }
        throw e;
      }
      if (!valid()) return '';
      await reload();
      return { autorizar: 'Acompanhamento autorizado.', recusar: 'Solicitação recusada.', revogar: 'Acompanhamento revogado.' }[decision];
    });
  }
  return <FollowPage title="Responsáveis" subtitle="Você decide quem pode acompanhar sua rotina escolar." loading={loading} error={error || action.error} reload={reload} busy={action.busy}>
    <ActionButton title="Voltar ao Início" secondary onPress={() => router.navigate('/')} />
    {!!action.message && <Text accessibilityRole="alert" style={styles.message}>{action.message}</Text>}
    {data && !loading && <>
      {data.length === 0 && <Text style={styles.message}>Nenhuma solicitação recebida. Um responsável pode solicitar acompanhamento usando seu e-mail.</Text>}
      {[['pendente', 'Solicitações recebidas'], ['autorizado', 'Responsáveis autorizados'], ['historico', 'Vínculos encerrados']].map(([status, title]) => {
        const links = data.filter(item => status === 'historico' ? ['recusado', 'revogado'].includes(item.status) : item.status === status);
        if (!links.length) return null;
        return <View key={status} style={styles.section}><Text accessibilityRole="header" style={sharedStyles.sectionTitle}>{title}</Text>
          {links.map(link => <LinkCard key={link.id} link={link} student>
            {link.status === 'pendente' && <>
              <Text style={styles.hint}>Ao autorizar, este responsável poderá consultar suas matérias, tarefas e progresso, sem editar.</Text>
              <View style={styles.actions}>
                <View style={styles.action}><ActionButton title="Autorizar" disabled={action.busy || loading} onPress={() => decide(link, 'autorizar')} /></View>
                <View style={styles.action}><ActionButton title="Recusar" secondary disabled={action.busy || loading} onPress={() => decide(link, 'recusar')} /></View>
              </View>
            </>}
            {link.status === 'autorizado' && <ActionButton title="Revogar acesso" secondary disabled={action.busy || loading} onPress={() => decide(link, 'revogar')} />}
          </LinkCard>)}
        </View>;
      })}
    </>}
  </FollowPage>;
}
