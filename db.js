const mysql = require('mysql2/promise');
const { db } = require('./config.json');

const con = mysql.createPool(db);

// Attempt to catch disconnects
con.on('connection', (connection) => {
  console.log('DB Connection established');
  connection.on('error', (err) => {
    console.error(new Date(), 'MySQL error', err.code);
  });
  connection.on('close', (err) => {
    console.error(new Date(), 'MySQL close', err);
  });
});

module.exports = con;

// async function random() {
//   const getMap = 'SELECT esoc.maps.ID, esoc.maps.DisplayName, esoc.maps.MiniMapUrl, ' +
//     'phpBB.p_users.username, esoc.maps.TPs, esoc.maps.Natives, esoc.maps.Outlaws, ' +
//     'esoc.maps.Date, esoc.maps.GameType FROM esoc.maps LEFT JOIN phpBB.p_users ON ' +
//     'esoc.maps.Author = phpBB.p_users.user_id';
//   const [rows, fields] = await con.execute(getMap);
//   console.log(JSON.stringify(rows));
// }
