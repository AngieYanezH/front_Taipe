const mysql = require('mysql2');

const pool = mysql.createPool({
  host: 'localhost',
  user: 'trabajo',
  password: 'Daniel4356',
  database: 'db_acceso_salud',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

module.exports = pool.promise();