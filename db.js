const mysql = require('mysql2/promise');

const con = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
});

// Attempt to catch disconnects
con.on('connection', (connection) => {
  console.debug('DB Connection established');
  connection.on('error', (err) => {
    console.error(`${new Date()} MySQL error  ${err.code}`);
  });
  connection.on('close', (err) => {
    console.error(`${new Date()} MySQL close ${err}`);
  });
});

module.exports = con;
