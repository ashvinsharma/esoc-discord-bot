/* eslint-disable */
const request = require('request-promise');
const cheerio = require('cheerio');
const { ESO_POP, YELLOW } = require('./../constants');

module.exports = {
  name: 'esopop',
  description: 'Returns population of eso.',
  async execute(message) {
    // noinspection JSUnusedGlobalSymbols
    const options = {
      uri: ESO_POP,
      transform: body => cheerio.load(body),
    };

    const $ = await request(options);
    const selector = $('#TotalUsersDetailsView tr td');
    const numbers = [];
    const emojis = message.client.emojis;
    for (let i = 1; i < 6; i += 2) numbers.push(selector[i].children[0].data);
    const description = `${emojis.find('name', 'AoE')} **Vanilla:** ${numbers[0]} online\n`
        + `${emojis.find('name', 'TAD')} **TAD**: ${numbers[2]} online`;
    const embed = {
      title: `ESO Population Statistics`,
      description,
      url: ESO_POP,
      color: YELLOW,
      fields: [],
    };
    message.channel.send({ embed });
  },
};
