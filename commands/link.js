const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const { log, logError } = require('./../logger');
const db = require('./../db');

const validate = async (args) => {
  if (args.length !== 2) return [false, 'Only two arguments are required for this command'];

  const [result, fields] = await db.query('SELECT p.user_password FROM phpBB.p_users as p '
    + `WHERE p.username_clean LIKE '${args[0].toLowerCase()}'`);

  const hash = await bcrypt.hash(args[1], 10);
  const match = await bcrypt.compare(args[1], result[0].user_password);
  if (!match) return [false, 'Your username and password don\'t match'];
  return [true];
};

module.exports = {
  name: 'link',
  description: 'Links your discord with esoc',
  async execute(msg, args) {
    const isValid = await validate(args);
    if (isValid[0] === false) {
      msg.channel.send(isValid[1]);
    }
    msg.channel.send('YO!');
    // generate token and create the link
  },
};
