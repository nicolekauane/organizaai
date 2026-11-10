import React from 'react';
import { Stack } from 'expo-router';
import { Text, TouchableOpacity } from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { palette } from '../../styles/theme';
export default function GuardianLayout() {
  const { user, version, logout } = useAuth();
  if (user?.tipo_usuario !== 'responsavel') return null;
  return <Stack key={version} screenOptions={{
    headerStyle: { backgroundColor: '#FFF7FA' }, headerTintColor: palette.bordo,
    headerTitleStyle: { color: palette.bordoEscuro, fontWeight: '700' },
    headerRight: () => <TouchableOpacity onPress={logout} accessibilityRole="button" accessibilityLabel="Sair da conta" style={{ padding: 12 }}><Text style={{ color: palette.bordo, fontWeight: '700' }}>Sair</Text></TouchableOpacity>,
  }}>
    <Stack.Screen name="index" options={{ title: 'Alunos acompanhados' }} />
    <Stack.Screen name="[alunoId]" options={{ title: 'Acompanhamento' }} />
  </Stack>;
}
