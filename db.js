const mysql = require('mysql2/promise');
const { log, logError } = require('./logger');

const con = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
});

// Attempt to catch disconnects
con.on('connection', (connection) => {
  log('Database Connection established');
  connection.on('error', (err) => {
    logError(`Database error. MySQL error: ${err.code}`);
  });
  connection.on('close', (err) => {
    logError(`Database connection closed. ${err}`);
  });
});

module.exports = con;
