import { Pool } from 'pg';
import dotenv from 'dotenv';
dotenv.config();


const pool = new Pool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: Number(process.env.DB_PORT),
});

// Fonction helper pour exécuter des requêtes SQL
export async function query(sqlString: string, params: any[] = []): Promise<any> {
  try {
    const client = await pool.connect();
    try {
      const result = await client.query(sqlString, params);
      return result.rows;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Erreur lors de l\'exécution de la requête SQL :', error);
    throw error;
  }
}
