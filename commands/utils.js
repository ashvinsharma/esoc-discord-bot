module.exports = {
  mentionToUserId(mention) {
    return mention.replace(/[<@!>]/g, '');
  },
};
