const net = require('net');

async function check(message) {
  const socket = new net.Socket();
  /* socket.setTimeout(1000); */
  socket.connect(2300, '168.61.152.225', () => {
    message.channel.send('ESO is up and runnin');
  });
  socket.end();
  socket.on('error', () => {
    message.channel.send('Down I guess');
  });
}

module.exports = {
  name: 'eso',
  description: 'Tells if ESO is down or not.',
  async execute(message, args) {
    await check(message).catch(e => console.error(e.message));
  },
};
