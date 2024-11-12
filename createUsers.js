const bcrypt = require('bcrypt');
const mysql = require('mysql2/promise');

const dbConfig = {
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'nursecare'
};

async function createUser(userName, userMail, userPass, userRole) {
    const connection = await mysql.createConnection(dbConfig); // Connection a la bdd
    
    const hashedPassword = await bcrypt.hash(userPass, 10); // On stock le mdp hashé dans une variable hashedPassword
    
    const sql = 'INSERT INTO users (userName, userMail, userPass, userRole) VALUES (?, ?, ?, ?)';
    await connection.execute(sql, [userName, userMail, hashedPassword, userRole]); // On envoie la requete insert into
    
    console.log(`Utilisateur créé : ${userName}`);
    await connection.end(); // On consolelog la confirmation que les users on bien été créé
}

async function main() {
    await createUser('John Secret', 'john.secret@mail.com', 'john.secret01', '2'); // Création secretaire john
}

main().catch(err => console.error(err));