const db = require('./database');

const users = db.prepare('SELECT * FROM users').all();
console.log('--- Users in DB ---');
users.forEach(u => {
    console.log(`ID: ${u.id}, Username: ${u.username}, Password: ${u.password.substring(0, 15)}...`);
});
