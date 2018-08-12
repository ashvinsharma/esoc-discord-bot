function log(string) {
  const timestamp = new Date();
  console.log(`[${timestamp}]: ${string}`);
}

function logError(string) {
  const timestamp = new Date();
  console.trace(`[${timestamp}]:     ERROR: ${string}`);
}

module.exports = {
  log,
  logError,
};
