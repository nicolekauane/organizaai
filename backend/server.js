require('dotenv').config();
const express = require('express');
const cors = require('cors');
const pool = require('./src/config/database');

const app = express();
app.use(cors());
app.use(express.json({ limit: '100kb' }));

app.get('/api/health', (_req, res) => res.json({ status: 'ok', message: 'Organiza Aí API funcionando.' }));
app.get('/api/health/db', async (_req, res, next) => {
  try {
    const [rows] = await pool.execute('SELECT 1 AS conectado');
    res.json({ status: 'ok', database: process.env.DB_NAME || 'organiza_ai', conectado: rows[0].conectado === 1 });
  } catch (error) { next(error); }
});
app.use('/api/usuarios', require('./src/routes/usuarios'));
app.use('/api/materias', require('./src/routes/materias'));
app.use('/api/tarefas', require('./src/routes/tarefas'));
app.use((_req, res) => res.status(404).json({ error: 'Rota não encontrada.' }));
app.use((error, _req, res, _next) => {
  console.error(error);
  if (error.code === 'ER_DUP_ENTRY') return res.status(409).json({ error: 'Já existe um registro com esses dados únicos.' });
  if (error.code === 'ER_NO_REFERENCED_ROW_2' || error.code === 'ER_ROW_IS_REFERENCED_2') return res.status(400).json({ error: 'Referência inválida ou registro relacionado.' });
  if (error.type === 'entity.parse.failed') return res.status(400).json({ error: 'JSON inválido.' });
  res.status(500).json({ error: 'Erro interno do servidor.' });
});

const port = Number(process.env.PORT || 3000);
const server = app.listen(port, () => console.log(`Organiza Aí API disponível em http://localhost:${port}`));

async function shutdown() {
  server.close(async () => {
    await pool.end();
    process.exit(0);
  });
}
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
