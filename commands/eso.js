const http = require('http');
const { log } = require('./../logger');

// WARNING! Before you change stuff:
// timeout event does not close the request so we have to close it manually
// or we risk getting both error & timeout event (ESOC bot would send both up & down message)
// We could abort request in timeout to prevent this, but problem is abort triggers error event..
// A simple "esoIsUp" boolean solves the above issues
function check(message) {
  let esoIsUp = true;

  function handleResponse() {
    if (esoIsUp) {
      log('Got a response from ESO, it must be up');
      message.channel.send('ESO is up and runnin');
    }
  }

  function handleTimeout() {
    esoIsUp = false;
    log('ESO request timeout, ESO is probably down');
    message.channel.send('Down I guess');
  }

  log('Checking ESO status...');
  http.get('http://168.61.152.225:2300')
    .setTimeout(1000)
    .on('response', handleResponse) // ESO is up
    .on('error', handleResponse) // ESO is up
    .on('timeout', handleTimeout); // ESO is down
}

module.exports = {
  name: 'eso',
  description: 'Tells if ESO is down or not.',
  execute(message) {
    check(message);
  },
};
