const net = require('net');
const { logError } = require('./../logger');

async function check(message) {
  const socket = new net.Socket();
  socket.setTimeout(1000);
  socket.connect(2300, '168.61.152.225', () => {
    message.channel.send('ESO is up and runnin');
    socket.end();
  });
  socket.on('timeout', () => {
    message.channel.send('Down I guess');
    logError('Connection to ESO timed out');
    socket.end();
  });
}

module.exports = {
  name: 'eso',
  description: 'Tells if ESO is down or not.',
  async execute(message) {
    await check(message)
      .catch(e => console.error(`${new Date()}: ${__filename}\n ${e}`));
  },
};
