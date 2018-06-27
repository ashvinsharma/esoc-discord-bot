const mysql = require('mysql2/promise');
const { db } = require('./config.json');

const con = mysql.createPool(db);

// Attempt to catch disconnects
con.on('connection', (connection) => {
  console.log('DB Connection established');
  connection.on('error', (err) => {
    console.error(`${new Date()} MySQL error  ${err.code}`);
  });
  connection.on('close', (err) => {
    console.error(`${new Date()} MySQL close ${err}`);
  });
});

module.exports = con;
