import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import pool from './config/database';
import apiRoutes from './routes';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(express.json());
app.use(cors());

// Health check
app.get('/api/health', (_req: Request, res: Response): void => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API routes
app.use('/api/v1', apiRoutes);

// Error handling middleware
app.use((err: Error, _req: Request, res: Response): void => {
  console.error(err);
  res.status(500).json({ error: 'Internal Server Error' });
});

// Auto-migrate on startup
async function migrate(): Promise<void> {
  try {
    const tableCheck = await pool.query(
      `SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'users')`
    );
    if (!tableCheck.rows[0].exists) {
      console.log('Running database migration...');
      const fs = await import('fs');
      const path = await import('path');
      const sql = fs.readFileSync(path.join(__dirname, 'db/migrations/001_initial_schema.sql'), 'utf8');
      await pool.query(sql);
      console.log('Migration complete.');
    } else {
      console.log('Database already migrated.');
    }
  } catch (err) {
    console.error('Migration error:', err);
  }
}

// Start server
migrate().then(() => {
  app.listen(PORT, () => {
    console.log(`IMC Server running on port ${PORT}`);
  });
});
