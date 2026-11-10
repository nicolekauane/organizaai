const jwt = require('jsonwebtoken');
function authenticate(config) {
  return (req, res, next) => {
    const match = /^Bearer ([^\s]+)$/i.exec(req.get('Authorization') || '');
    try {
      if (!match) throw new Error('missing');
      const payload = jwt.verify(match[1], config.secret, {
        algorithms: ['HS256'], issuer: config.issuer, audience: config.audience,
      });
      if (typeof payload.sub !== 'string' || !/^[1-9]\d*$/.test(payload.sub) ||
          !Number.isSafeInteger(Number(payload.sub)) || !Number.isInteger(payload.exp)) throw new Error('claims');
      req.auth = { userId: Number(payload.sub) };
      next();
    } catch {
      res.set('WWW-Authenticate', 'Bearer');
      res.status(401).json({ error: 'Autenticação necessária ou token inválido.' });
    }
  };
}
module.exports = { authenticate };
