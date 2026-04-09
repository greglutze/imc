import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

// V2 uses its own DATABASE_URL — completely separate from V1
const pool = process.env.V2_DATABASE_URL
  ? new Pool({
      connectionString: process.env.V2_DATABASE_URL,
      ssl: process.env.V2_DATABASE_URL.includes('railway') ? { rejectUnauthorized: false } : undefined,
    })
  : new Pool({
      host: process.env.V2_PGHOST || 'localhost',
      port: parseInt(process.env.V2_PGPORT || '5432'),
      user: process.env.V2_PGUSER,
      password: process.env.V2_PGPASSWORD,
      database: process.env.V2_PGDATABASE || 'imc_v2',
      ssl: process.env.V2_PGHOST ? { rejectUnauthorized: false } : undefined,
    });

pool.on('error', (err) => {
  console.error('[V2] Unexpected error on idle client', err);
});

export default pool;
