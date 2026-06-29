import { Pool } from 'pg';
import dotenv from 'dotenv';

// Load env before any module that reads process.env at module scope
dotenv.config();

export const pool = new Pool({ connectionString: process.env.DATABASE_URL });
