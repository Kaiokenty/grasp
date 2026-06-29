import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { pool } from '../db/pool';
import { logger } from '../utils/logger';

const router = Router();

router.post('/signup', async (req: Request, res: Response): Promise<void> => {
  const { email, password } = req.body;

  if (!email || typeof email !== 'string') {
    res.status(400).json({ error: 'Email required' });
    return;
  }
  if (!password || typeof password !== 'string' || password.length < 8) {
    res.status(400).json({ error: 'Password must be at least 8 characters' });
    return;
  }

  const normalizedEmail = email.toLowerCase().trim();

  try {
    const existing = await pool.query(
      'SELECT id FROM users WHERE email = $1',
      [normalizedEmail]
    );
    if (existing.rows.length > 0) {
      res.status(409).json({ error: 'Email already registered' });
      return;
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const result = await pool.query(
      'INSERT INTO users (email, password_hash) VALUES ($1, $2) RETURNING id',
      [normalizedEmail, passwordHash]
    );

    const userId: string = result.rows[0].id;
    const token = jwt.sign(
      { userId, email: normalizedEmail },
      process.env.JWT_SECRET!,
      { expiresIn: '7d' }
    );

    res.status(201).json({ userId, token });
  } catch (err) {
    logger.error('Signup failed', { email: normalizedEmail, error: (err as Error).message });
    throw err;
  }
});

router.post('/login', async (req: Request, res: Response): Promise<void> => {
  const { email, password } = req.body;

  if (!email || !password) {
    res.status(400).json({ error: 'Email and password required' });
    return;
  }

  const normalizedEmail = (email as string).toLowerCase().trim();

  try {
    const result = await pool.query(
      'SELECT id, password_hash FROM users WHERE email = $1',
      [normalizedEmail]
    );

    const user = result.rows[0];
    // Always run bcrypt.compare even if user not found — prevents timing attack
    const dummyHash = '$2a$12$invalidhashfortimingprotection000000000000000000000000';
    const valid = user
      ? await bcrypt.compare(password, user.password_hash)
      : await bcrypt.compare(password, dummyHash).then(() => false);

    if (!valid) {
      res.status(401).json({ error: 'Invalid credentials' });
      return;
    }

    const token = jwt.sign(
      { userId: user.id, email: normalizedEmail },
      process.env.JWT_SECRET!,
      { expiresIn: '7d' }
    );

    res.json({ userId: user.id, token });
  } catch (err) {
    logger.error('Login failed', { email: normalizedEmail, error: (err as Error).message });
    throw err;
  }
});

export default router;
