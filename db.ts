import mysql, { ResultSetHeader, RowDataPacket } from 'mysql2/promise';
import dotenv from 'dotenv';
dotenv.config();

// Mise à jour de l'interface pour qu'elle corresponde à un type de ligne de données
type QueryResult = RowDataPacket[] & ResultSetHeader;

// Création d'une pool de connexions à la base de données
const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: Number(process.env.DB_PORT),
});

// Fonction helper pour exécuter des requêtes SQL
export async function query(sqlString: string, params: any[] = []): Promise<QueryResult> {
  try {
    const [rows] = await pool.execute<QueryResult>(sqlString, params);
    return rows;
  } catch (error) {
    console.error('Erreur lors de l\'exécution de la requête SQL :', error);
    throw error;
  }
}