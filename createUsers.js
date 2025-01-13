const bcrypt = require('bcrypt');
const { Pool } = require('pg');

const dbConfig = {
    host: 'localhost',
    user: 'postgres',
    password: '09Gvgxde22,,',
    database: 'nursecare',
    port: 5432
};

const pool = new Pool(dbConfig);

async function createUser(userName, userMail, userPass, userRole) {
    const client = await pool.connect(); 

    try {
        const hashedPassword = await bcrypt.hash(userPass, 10);

        const sql = 'INSERT INTO users (username, usermail, userpass, userrole) VALUES ($1, $2, $3, $4)';
        await client.query(sql, [userName, userMail, hashedPassword, userRole]);

        console.log(`Utilisateur créé : ${userName}`);
    } catch (err) {
        console.error('Erreur lors de la création de l\'utilisateur :', err);
        throw err;
    } finally {
        client.release();
    }
}

async function main() {
    await createUser('John Secret', 'john.secret@mail.com', 'john.secret01', 'secretary');
}

main().catch(err => console.error(err));
