const router = require('express').Router();
// The legacy user CRUD is not used by the Entrega 2 frontend.
// Keep it closed until account management has explicit authorization rules.
router.use((_req, res) => res.status(403).json({ error: 'CRUD de usuários indisponível. Use /api/auth/cadastro, /login e /me.' }));
module.exports = router;
