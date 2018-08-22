const jwt = require('jsonwebtoken');
const { log, logError } = require('./../logger');
const { ESOC, ESOC_AUTH } = require('./../constants');

const validate = (args) => {
  if (args.length !== 0) return [false, 'No argument is required for this command'];
  return [true];
};

module.exports = {
  name: 'link',
  description: 'Links your discord with esoc',
  async execute(msg, args) {
    const isValid = validate(args);
    if (isValid[0] === false) {
      msg.channel.send(isValid[1]);
      return;
    }

    const user = {
      id: msg.author.id,
      username: msg.author.username,
      discriminator: msg.author.discriminator,
    };
    const token = jwt.sign({ user }, process.env.SECRET_JWT_KEY);
    msg.channel.send(`Link your discord account with ESOC using this link:\n${ESOC}/${ESOC_AUTH}${token}`);
  },
};
