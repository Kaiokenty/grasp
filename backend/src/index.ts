import express from 'express';
import dotenv from 'dotenv';
import { pool } from './db/pool';
import { logger } from './utils/logger';
import { errorHandler } from './middleware/errorHandler';
import authRouter from './routes/auth';
import notesRouter from './routes/notes';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(express.json());

app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.use('/api/auth', authRouter);
app.use('/api/notes', notesRouter);
app.use(errorHandler);

(async () => {
  try {
    await pool.query('SELECT 1');
    logger.info('Database connected');
  } catch (err) {
    logger.error('Database connection failed', { error: (err as Error).message });
    process.exit(1);
  }

  app.listen(PORT, () => {
    logger.info('GRASP API running', { port: PORT });
  });
})();
