import { Router, Request, Response } from 'express';
import multer from 'multer';
import OpenAI, { toFile } from 'openai';
import Anthropic from '@anthropic-ai/sdk';
import { pool } from '../db/pool';
import { requireAuth } from '../middleware/auth';
import { logger } from '../utils/logger';
import { CATEGORIES, URGENCIES, type Category, type Urgency } from '../constants/categories';

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// Frozen — changes require revalidation against 20+ test notes (CLAUDE.md rule #6)
const ORGANIZE_SYSTEM_PROMPT = `You are a note organizer. Extract from the user's note:
- Category: one of [Work, Personal, Shopping, Health, Ideas, Other]
- Urgency: one of [High, Medium, Low]
- Tasks: array of actionable items (strings, or empty array)

Return valid JSON ONLY: {"category": "...", "urgency": "...", "tasks": [...]}`;

router.post(
  '/transcribe',
  requireAuth,
  upload.single('audio'),
  async (req: Request, res: Response): Promise<void> => {
    if (!req.file) {
      res.status(400).json({ error: 'Audio file required' });
      return;
    }

    try {
      const file = await toFile(req.file.buffer, req.file.originalname, {
        type: req.file.mimetype,
      });
      const transcription = await openai.audio.transcriptions.create({
        file,
        model: 'whisper-1',
      });

      res.json({ transcript: transcription.text });
    } catch (err) {
      logger.error('Whisper transcription failed', {
        userId: req.user.userId,
        audioSize: req.file.size,
        error: (err as Error).message,
      });
      res.status(502).json({ error: 'Recording failed. Try typing instead.' });
    }
  }
);

router.post('/organize', requireAuth, async (req: Request, res: Response): Promise<void> => {
  const { raw_text } = req.body;

  if (!raw_text || typeof raw_text !== 'string' || raw_text.trim().length === 0) {
    res.status(400).json({ error: 'raw_text required' });
    return;
  }

  // Step 1: Call Claude
  let claudeText: string;
  try {
    const message = await anthropic.messages.create(
      {
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 256,
        system: [
          {
            type: 'text',
            text: ORGANIZE_SYSTEM_PROMPT,
            cache_control: { type: 'ephemeral' },
          },
        ] as Anthropic.MessageCreateParams['system'],
        messages: [{ role: 'user', content: raw_text }],
      },
      { headers: { 'anthropic-beta': 'prompt-caching-2024-07-31' } }
    );

    claudeText =
      message.content[0]?.type === 'text' ? message.content[0].text : '';
  } catch (err) {
    logger.error('Claude API call failed', {
      userId: req.user.userId,
      rawTextLength: raw_text.length,
      error: (err as Error).message,
    });
    res.status(502).json({ error: "Couldn't organize this note. Try again or edit manually." });
    return;
  }

  // Step 2: Parse + validate (CLAUDE.md rule #7)
  let category: Category;
  let urgency: Urgency;
  let tasks: string[];
  try {
    const stripped = claudeText.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '').trim();
    const parsed = JSON.parse(stripped) as Record<string, unknown>;

    if (
      !CATEGORIES.includes(parsed.category as Category) ||
      !URGENCIES.includes(parsed.urgency as Urgency) ||
      !Array.isArray(parsed.tasks) ||
      !(parsed.tasks as unknown[]).every((t) => typeof t === 'string')
    ) {
      throw new Error('Schema validation failed');
    }

    category = parsed.category as Category;
    urgency = parsed.urgency as Urgency;
    tasks = parsed.tasks as string[];
  } catch (err) {
    logger.error('Claude response invalid', {
      userId: req.user.userId,
      claudeText,
      error: (err as Error).message,
    });
    res.status(502).json({ error: "Couldn't organize this note. Try again or edit manually." });
    return;
  }

  // Step 3: Persist to DB
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const noteResult = await client.query<{ id: string }>(
      `INSERT INTO notes (user_id, raw_text, category, urgency, extracted_tasks)
       VALUES ($1, $2, $3, $4, $5) RETURNING id`,
      [req.user.userId, raw_text, category, urgency, JSON.stringify(tasks)]
    );
    const noteId = noteResult.rows[0].id;

    if (tasks.length > 0) {
      const placeholders = tasks
        .map((_, i) => `($${i * 2 + 1}, $${i * 2 + 2})`)
        .join(', ');
      const params = tasks.flatMap((desc) => [noteId, desc]);
      await client.query(
        `INSERT INTO tasks (note_id, description) VALUES ${placeholders}`,
        params
      );
    }

    await client.query('COMMIT');
    res.status(201).json({ note_id: noteId, category, urgency, tasks });
  } catch (err) {
    await client.query('ROLLBACK');
    logger.error('DB insert failed', {
      userId: req.user.userId,
      error: (err as Error).message,
    });
    res.status(500).json({ error: "Couldn't organize this note. Try again or edit manually." });
  } finally {
    client.release();
  }
});

export default router;
