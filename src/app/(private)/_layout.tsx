import React from 'react';
import { Stack, router } from 'expo-router';
import { Text, TouchableOpacity, View } from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { palette } from '../../styles/theme';
export default function PrivateLayout() {
  const { user, version, logout } = useAuth();
  if (user?.tipo_usuario !== 'aluno') return null;
  return <Stack key={version} screenOptions={{
    headerStyle: { backgroundColor: '#FFF7FA' }, headerTintColor: palette.bordo,
    headerTitleStyle: { color: palette.bordoEscuro, fontWeight: '700' },
    headerRight: () => <View style={{ flexDirection: 'row', alignItems: 'center' }}>
      <TouchableOpacity accessibilityRole="button" accessibilityLabel="Ver responsáveis" onPress={() => router.navigate('/responsaveis')} style={{ padding: 10 }}><Text style={{ color: palette.bordo, fontWeight: '700' }}>Responsáveis</Text></TouchableOpacity>
      <TouchableOpacity onPress={logout} accessibilityRole="button" accessibilityLabel="Sair da conta" style={{ padding: 12 }}><Text style={{ color: palette.bordo, fontWeight: '700' }}>Sair</Text></TouchableOpacity></View>,
  }}>
    <Stack.Screen name="index" options={{ title: 'Início' }} />
    <Stack.Screen name="tarefas" options={{ title: 'Tarefas' }} />
    <Stack.Screen name="materias" options={{ title: 'Matérias' }} />
    <Stack.Screen name="responsaveis" options={{ title: 'Responsáveis' }} />
  </Stack>;
}
