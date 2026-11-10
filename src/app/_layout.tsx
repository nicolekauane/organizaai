import React from 'react';
import { Stack } from 'expo-router';
import { canAccessProfile } from '../auth/profiles';
import { AuthProvider, useAuth } from '../context/AuthContext';
function Routes() {
  const { user } = useAuth();
  return <Stack screenOptions={{ headerShown: false }}>
    <Stack.Protected guard={canAccessProfile(user, 'aluno')}><Stack.Screen name="(private)" /></Stack.Protected>
    <Stack.Protected guard={canAccessProfile(user, 'responsavel')}><Stack.Screen name="acompanhamento" /></Stack.Protected>
    <Stack.Protected guard={!user}>
      <Stack.Screen name="login" /><Stack.Screen name="cadastro" />
    </Stack.Protected>
  </Stack>;
}
export default function RootLayout() { return <AuthProvider><Routes /></AuthProvider>; }
