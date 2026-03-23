import { Router, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import pool from '../config/database';
import { authMiddleware } from '../middleware/auth';
import { AuthRequest } from '../types';

const router = Router();
const JWT_EXPIRY = '7d';

const generateToken = (user: {
  id: string;
  email: string;
  name: string;
  org_id: string;
  role: 'owner' | 'member';
  tier: 'creator' | 'pro' | 'team' | 'enterprise';
}): string => {
  const jwtSecret = process.env.JWT_SECRET;
  if (!jwtSecret) throw new Error('JWT_SECRET not configured');

  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      name: user.name,
      org_id: user.org_id,
      role: user.role,
      tier: user.tier,
    },
    jwtSecret,
    { expiresIn: JWT_EXPIRY }
  );
};

router.post('/register', async (req: AuthRequest, res: Response): Promise<void> => {
  const { email, password, name, org_name } = req.body;

  if (!email || !password || !name || !org_name) {
    res.status(400).json({ error: 'Missing required fields' });
    return;
  }

  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const existingUser = await client.query('SELECT id FROM users WHERE email = $1', [email]);
    if (existingUser.rows.length > 0) {
      res.status(409).json({ error: 'Email already registered' });
      return;
    }

    const orgId = uuidv4();
    await client.query(
      'INSERT INTO organizations (id, name, created_at) VALUES ($1, $2, NOW())',
      [orgId, org_name]
    );

    const userId = uuidv4();
    const passwordHash = await bcrypt.hash(password, 10);

    await client.query(
      'INSERT INTO users (id, email, name, org_id, role, tier, password_hash, created_at) VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())',
      [userId, email, name, orgId, 'owner', 'creator', passwordHash]
    );

    await client.query('COMMIT');

    const user = {
      id: userId,
      email,
      name,
      org_id: orgId,
      role: 'owner' as const,
      tier: 'creator' as const,
    };

    const token = generateToken(user);

    res.status(201).json({
      token,
      user,
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Register error:', error);
    res.status(500).json({ error: 'Registration failed' });
  } finally {
    client.release();
  }
});

router.post('/login', async (req: AuthRequest, res: Response): Promise<void> => {
  const { email, password } = req.body;

  if (!email || !password) {
    res.status(400).json({ error: 'Email and password required' });
    return;
  }

  try {
    const result = await pool.query(
      'SELECT id, email, name, org_id, role, tier, password_hash FROM users WHERE email = $1',
      [email]
    );

    if (result.rows.length === 0) {
      res.status(401).json({ error: 'Invalid credentials' });
      return;
    }

    const userRow = result.rows[0];
    const passwordMatch = await bcrypt.compare(password, userRow.password_hash);

    if (!passwordMatch) {
      res.status(401).json({ error: 'Invalid credentials' });
      return;
    }

    const user = {
      id: userRow.id,
      email: userRow.email,
      name: userRow.name,
      org_id: userRow.org_id,
      role: userRow.role,
      tier: userRow.tier,
    };

    const token = generateToken(user);

    res.json({
      token,
      user,
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

router.get('/me', authMiddleware, (req: AuthRequest, res: Response): void => {
  if (!req.user) {
    res.status(401).json({ error: 'Not authenticated' });
    return;
  }

  res.json({ user: req.user });
});

router.post('/invite', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  if (!req.user) {
    res.status(401).json({ error: 'Not authenticated' });
    return;
  }

  if (req.user.role !== 'owner') {
    res.status(403).json({ error: 'Only organization owners can invite users' });
    return;
  }

  const { email, name, password, role = 'member' } = req.body;

  if (!email || !name || !password) {
    res.status(400).json({ error: 'Email, name, and password required' });
    return;
  }

  try {
    const existingUser = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
    if (existingUser.rows.length > 0) {
      res.status(409).json({ error: 'Email already registered' });
      return;
    }

    const userId = uuidv4();
    const passwordHash = await bcrypt.hash(password, 10);

    await pool.query(
      'INSERT INTO users (id, email, name, org_id, role, tier, password_hash, created_at) VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())',
      [userId, email, name, req.user.org_id, role, 'creator', passwordHash]
    );

    const user = {
      id: userId,
      email,
      name,
      org_id: req.user.org_id,
      role: role as 'owner' | 'member',
      tier: 'creator' as const,
    };

    const token = generateToken(user);

    res.status(201).json({
      token,
      user,
    });
  } catch (error) {
    console.error('Invite error:', error);
    res.status(500).json({ error: 'Invitation failed' });
  }
});

export default router;
