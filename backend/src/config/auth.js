function readAuthConfig(env = process.env) {
  const secret = env.JWT_SECRET;
  if (!secret || Buffer.byteLength(secret) < 32 || secret.includes('COLOQUE_')) {
    throw new Error('Configure JWT_SECRET privado e aleatório com pelo menos 32 bytes.');
  }
  return { secret, issuer: 'organiza-ai-api', audience: 'organiza-ai-app', expiresIn: 900 };
}
module.exports = { readAuthConfig };
