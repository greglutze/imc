import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { migrate } from './config/migrate';
import apiRoutes from './routes';

dotenv.config();

const app = express();
const PORT = process.env.V2_PORT || 3002; // V1 runs on 3001

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));

// Health check
app.get('/api/health', (_req: Request, res: Response): void => {
  res.json({
    status: 'ok',
    product: 'imc-v2',
    timestamp: new Date().toISOString(),
  });
});

// Serve archive images (public — no auth, before API routes)
import pool from './config/database';
app.get('/api/archive/:artistId/items/:itemId/image', async (req: Request, res: Response): Promise<void> => {
  try {
    const result = await pool.query(
      'SELECT image_data, image_content_type FROM archive_items WHERE id = $1 AND artist_id = $2',
      [req.params.itemId, req.params.artistId]
    );
    if (result.rows.length === 0 || !result.rows[0].image_data) {
      res.status(404).json({ error: 'Image not found' });
      return;
    }
    const { image_data, image_content_type } = result.rows[0];
    const buffer = Buffer.from(image_data, 'base64');
    res.set('Content-Type', image_content_type || 'image/jpeg');
    res.set('Cache-Control', 'public, max-age=86400');
    res.send(buffer);
  } catch (err) {
    console.error('[V2] Serve image error:', err);
    res.status(500).json({ error: 'Failed to serve image' });
  }
});

// API routes
app.use('/api', apiRoutes);

// Error handling
app.use((err: Error, _req: Request, res: Response, _next: NextFunction): void => {
  console.error('[V2]', err);
  res.status(500).json({ error: 'Internal Server Error' });
});

// Start
migrate().then(() => {
  app.listen(PORT, () => {
    console.log(`IMC V2 Server running on port ${PORT}`);
  });
});
