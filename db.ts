import { Pool } from 'pg';
import dotenv from 'dotenv';
dotenv.config();

const pool = new Pool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: Number(process.env.DB_PORT),
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

pool.on('connect', () => {
  console.log('New client connected to the pool');
});

pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
});

export async function query(sqlString: string, params: any[] = []): Promise<any> {
  try {
    const result = await pool.query(sqlString, params);
    return result.rows;
  } catch (error) {
    console.error('Erreur lors de l\'exécution de la requête SQL :', error);
    throw error;
  }
}

export async function closePool(): Promise<void> {
  await pool.end();
  console.log('Pool has ended');
}

process.on('SIGINT', async () => {
  await closePool();
  process.exit(0);
});