const Utils = require('./utils');

describe('isOnlyDigits', () => {
  it('returns true for only digits', () => {
    expect(Utils.isOnlyDigits(123)).toBe(true);
    expect(Utils.isOnlyDigits(0)).toBe(true);
    expect(Utils.isOnlyDigits(1)).toBe(true);
    expect(Utils.isOnlyDigits('123')).toBe(true);
    expect(Utils.isOnlyDigits('0123')).toBe(true);
    expect(Utils.isOnlyDigits('0')).toBe(true);
    expect(Utils.isOnlyDigits('1')).toBe(true);
  });

  it('returns false if there are other characters than digits', () => {
    expect(Utils.isOnlyDigits('abc')).toBe(false);
    expect(Utils.isOnlyDigits(() => {})).toBe(false);
    expect(Utils.isOnlyDigits([])).toBe(false);
    expect(Utils.isOnlyDigits({})).toBe(false);
    expect(Utils.isOnlyDigits(null)).toBe(false);
    expect(Utils.isOnlyDigits(false)).toBe(false);
    expect(Utils.isOnlyDigits(true)).toBe(false);
    expect(Utils.isOnlyDigits('')).toBe(false);
    expect(Utils.isOnlyDigits('abc123')).toBe(false);
    expect(Utils.isOnlyDigits('123abc')).toBe(false);
    expect(Utils.isOnlyDigits('abc123abc')).toBe(false);
    expect(Utils.isOnlyDigits('123abc123abc123')).toBe(false);
    expect(Utils.isOnlyDigits(' 1')).toBe(false);
    expect(Utils.isOnlyDigits('1 ')).toBe(false);
    expect(Utils.isOnlyDigits(' ')).toBe(false);
  });
});
