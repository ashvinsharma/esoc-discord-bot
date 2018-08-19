function log(string) {
  const timestamp = new Date();
  console.log(`[${timestamp}]: ${string}`);
}

function logError(string) {
  const timestamp = new Date();
  console.error(`[${timestamp}]:     ERROR: ${string}`);
  console.trace();
}

module.exports = {
  log,
  logError,
};
