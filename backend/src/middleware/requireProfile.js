// Run after authenticate. Permissions always use the current database profile.
function requireProfile(pool, profile) {
  return async (req, res, next) => {
    try {
      if (!req.auth?.userId) return res.status(401).json({ error: 'Autenticacao necessaria.' });
      const [rows] = await pool.execute('SELECT tipo_usuario FROM usuarios WHERE id = ?', [req.auth.userId]);
      if (!rows.length) return res.status(401).json({ error: 'Autenticacao necessaria.' });
      if (rows[0].tipo_usuario !== profile) return res.status(403).json({ error: 'Acesso permitido somente para ' + profile + '.' });
      next();
    } catch (error) { next(error); }
  };
}
module.exports = { requireProfile };
