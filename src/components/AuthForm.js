import React, { useRef, useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Link, router } from 'expo-router';
import { useAuth } from '../context/AuthContext';
import { validateAuthForm } from '../utils/authValidation';
import { palette, sharedStyles } from '../styles/theme';
function AuthField({ label, ...props }) {
  return <View style={styles.field}><Text style={styles.label}>{label}</Text>
    <TextInput accessibilityLabel={label} style={styles.input} placeholderTextColor={palette.cinzaMedio} {...props} />
  </View>;
}
export default function AuthForm({ registering = false }) {
  const { login, cadastro, loading, message } = useAuth();
  const [form, setForm] = useState({ nome: '', email: '', senha: '', confirmar: '', tipo_usuario: 'aluno' });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [busy, setBusy] = useState(false);
  const lock = useRef(false);
  const disabled = busy || loading;
  const update = (field, value) => { setForm(current => ({ ...current, [field]: value })); setError(''); };
  async function submit() {
    if (lock.current) return;
    const validation = validateAuthForm(form, registering);
    if (validation) { setError(validation); return; }
    lock.current = true; setBusy(true); setError(''); setSuccess('');
    try {
      if (registering) {
        await cadastro(form);
        setForm({ nome: '', email: '', senha: '', confirmar: '', tipo_usuario: 'aluno' });
        setSuccess('Conta criada! Volte ao login para entrar.');
      } else {
        await login(form.email, form.senha);
        setForm(current => ({ ...current, senha: '', confirmar: '' }));
      }
    } catch (e) {
      setError(e.message || 'Não foi possível continuar. Tente novamente.');
      setForm(current => ({ ...current, senha: '', confirmar: '' }));
    } finally { lock.current = false; setBusy(false); }
  }
  return <KeyboardAvoidingView style={styles.root} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
    <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.content}>
      <View style={styles.card}>
        <Text style={styles.brand}>{'Organiza Aí'}</Text>
        <Text style={styles.tagline}>{'Sua rotina escolar organizada, em um só lugar.'}</Text>
        <Text style={styles.title}>{registering ? 'Crie sua conta' : 'Bem-vindo de volta!'}</Text>
        {registering && <View style={styles.field}>
          <Text style={styles.label}>Tipo de conta</Text>
          <View style={{ flexDirection: 'row', gap: 12 }}>
            {[['aluno', 'Aluno'], ['responsavel', 'Responsável']].map(([value, label]) => <TouchableOpacity key={value} accessibilityRole="radio" aria-checked={form.tipo_usuario === value} accessibilityLabel={label} accessibilityState={{ checked: form.tipo_usuario === value, disabled }} disabled={disabled} onPress={() => update('tipo_usuario', value)} style={[form.tipo_usuario === value ? sharedStyles.primaryButton : sharedStyles.secondaryButton, { flex: 1, minHeight: 48 }]}>
              <Text style={form.tipo_usuario === value ? sharedStyles.primaryButtonText : sharedStyles.secondaryButtonText}>{label}</Text>
            </TouchableOpacity>)}
          </View>
          <Text style={styles.hint}>O responsável poderá acompanhar apenas alunos que autorizarem o acesso.</Text>
        </View>}
        {registering && <AuthField label="Nome completo" value={form.nome} onChangeText={value => update('nome', value)} editable={!disabled} autoCapitalize="words" autoComplete="name" maxLength={100} />}
        <AuthField label="E-mail" value={form.email} onChangeText={value => update('email', value)} editable={!disabled} autoCapitalize="none" autoCorrect={false} keyboardType="email-address" autoComplete="email" maxLength={150} />
        <AuthField label="Senha" value={form.senha} onChangeText={value => update('senha', value)} editable={!disabled} secureTextEntry={!showPassword} autoCapitalize="none" autoCorrect={false} autoComplete={registering ? 'new-password' : 'current-password'} maxLength={128} onSubmitEditing={registering ? undefined : submit} />
        <TouchableOpacity accessibilityRole="button" accessibilityLabel={showPassword ? 'Ocultar senha' : 'Mostrar senha'} onPress={() => setShowPassword(value => !value)} style={styles.visibility}>
          <Text style={styles.link}>{showPassword ? 'Ocultar senha' : 'Mostrar senha'}</Text>
        </TouchableOpacity>
        {registering && <AuthField label="Confirmar senha" value={form.confirmar} onChangeText={value => update('confirmar', value)} editable={!disabled} secureTextEntry={!showPassword} autoCapitalize="none" autoCorrect={false} autoComplete="new-password" maxLength={128} onSubmitEditing={submit} />}
        {registering && <Text style={styles.hint}>Use de 8 a 128 caracteres para proteger sua conta.</Text>}
        {!!message && !registering && <Text accessibilityRole="alert" style={styles.notice}>{message}</Text>}
        {!!error && <Text accessibilityRole="alert" style={styles.error}>{error}</Text>}
        {!!success && <Text accessibilityRole="alert" style={styles.notice}>{success}</Text>}
        <TouchableOpacity accessibilityRole="button" accessibilityState={{ disabled, busy: disabled }} onPress={submit} disabled={disabled} style={[sharedStyles.primaryButton, styles.submit, disabled && styles.disabled]}>
          {disabled ? <ActivityIndicator color={palette.branco} accessibilityLabel="Aguarde" /> : <Text style={sharedStyles.primaryButtonText}>{registering ? 'Criar conta' : 'Entrar'}</Text>}
        </TouchableOpacity>
        {!disabled && <Link href={registering ? '/login' : '/cadastro'} replace asChild>
          <TouchableOpacity accessibilityRole="link" style={styles.footer} onPress={() => { setForm(current => ({ ...current, senha: '', confirmar: '' })); }}>
            <Text style={styles.link}>{registering ? 'Voltar ao login' : 'Ainda não tem conta? Criar uma conta'}</Text>
          </TouchableOpacity>
        </Link>}
        {!!success && <TouchableOpacity accessibilityRole="button" style={styles.footer} onPress={() => router.replace('/login')}><Text style={styles.link}>Ir para o login</Text></TouchableOpacity>}
      </View>
    </ScrollView>
  </KeyboardAvoidingView>;
}
const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: palette.rosaClaro },
  content: { flexGrow: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  card: { width: '100%', maxWidth: 460, padding: 26, borderRadius: 24, backgroundColor: palette.branco, borderWidth: 1, borderColor: '#F2D7E3' },
  brand: { color: palette.bordo, fontSize: 34, fontWeight: '800', textAlign: 'center' },
  tagline: { color: palette.cinzaMedio, textAlign: 'center', lineHeight: 22, marginTop: 8, marginBottom: 26 },
  title: { color: palette.bordoEscuro, fontSize: 23, fontWeight: '700', marginBottom: 22 },
  field: { marginBottom: 16 }, label: { color: palette.texto, fontWeight: '600', marginBottom: 8 },
  input: { minHeight: 48, paddingHorizontal: 14, paddingVertical: 12, borderWidth: 1, borderColor: '#E4CBD6', borderRadius: 12, color: palette.texto, backgroundColor: '#FFFCFD', fontSize: 16 },
  visibility: { alignSelf: 'flex-end', padding: 8, marginTop: -12, marginBottom: 12 },
  link: { color: palette.bordo, fontWeight: '700', textAlign: 'center' },
  hint: { color: palette.cinzaMedio, lineHeight: 20, marginBottom: 12 },
  error: { color: palette.bordoEscuro, lineHeight: 22, padding: 12, backgroundColor: '#FBE4EB', borderRadius: 10, marginBottom: 12 },
  notice: { color: palette.bordo, lineHeight: 22, padding: 12, backgroundColor: palette.rosaClaro, borderRadius: 10, marginBottom: 12 },
  submit: { minHeight: 48, marginTop: 8 }, disabled: { opacity: 0.65 }, footer: { paddingVertical: 18 },
});
