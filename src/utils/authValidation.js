export function validateAuthForm({ nome = '', email = '', senha = '', confirmar = '', tipo_usuario = 'aluno' }, registering = false) {
  if (registering && !['aluno', 'responsavel'].includes(tipo_usuario)) return 'Selecione Aluno ou Responsável.';
  if (registering && (!nome.trim() || nome.trim().length > 100)) return 'Informe seu nome completo (até 100 caracteres).';
  if (!email.trim() || email.trim().length > 150 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) return 'Informe um e-mail válido.';
  if (!senha) return 'Informe sua senha.';
  if (senha.length > 128 || (registering && senha.length < 8)) return 'A senha deve ter entre 8 e 128 caracteres.';
  if (registering && senha !== confirmar) return 'As senhas não coincidem.';
  return '';
}
