const { log, logError } = require('./');

describe('log', () => {
  it('outputs the log to the console as log', () => {
    console.log = jest.fn();
    log('my log message');
    expect(console.log.mock.calls[0][0]).toContain('my log message');
  });
});

describe('logError', () => {
  it('outputs the error to the console as error', () => {
    console.error = jest.fn();
    logError('my error message');
    expect(console.error.mock.calls[0][0]).toContain('my error message');
  });

  it('outputs the trace to the console', () => {
    console.trace = jest.fn();
    logError('my error message');
    expect(console.trace.mock.calls.length).toBe(1);
  });
});
