const { withAndroidManifest } = require('expo/config-plugins');

module.exports = ({ config }) => {
  const profile = process.env.EAS_BUILD_PROFILE;
  const local = profile === 'apk-local';
  if (profile || process.env.EAS_BUILD === 'true') {
    const value = process.env.EXPO_PUBLIC_API_URL;
    let url;
    try { url = new URL(value); } catch { throw new Error('Configure EXPO_PUBLIC_API_URL com a origem real da API antes do build.'); }
    if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password || url.search || url.hash || url.pathname !== '/') {
      throw new Error('EXPO_PUBLIC_API_URL deve ser uma origem HTTP(S), sem credenciais, /api, query ou fragmento.');
    }
    if (['localhost', '127.0.0.1', '0.0.0.0', '[::1]'].includes(url.hostname) || url.hostname.endsWith('.localhost')) {
      throw new Error('O APK exige uma API acessível pelo celular; localhost não é permitido.');
    }
    if (!local && url.protocol !== 'https:') throw new Error('Use HTTPS no perfil apk; HTTP é permitido apenas em apk-local para testes.');
  }
  return withAndroidManifest(config, (mod) => {
    const application = mod.modResults.manifest.application?.[0];
    if (!application) throw new Error('Aplicação Android não encontrada no manifesto.');
    application.$['android:usesCleartextTraffic'] = local ? 'true' : 'false';
    return mod;
  });
};
