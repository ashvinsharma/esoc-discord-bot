const request = require('request-promise');
const Discord = require('discord.js');
const parseString = require('xml2js').parseString;
const { ESO_QUERY, GREEN, RED } = require('./../constants');
const { log, logError } = require('./../logger');

const { escapeMarkdown } = Discord.Util;

function roundBy(n) {
  const scale = 10 ** 3;
  return Math.round(scale * n) / scale;
}

function generateFields(rating) {
  const arr = [];
  if (rating.s[0].points[0] !== '0' || rating.d[0].points[0] !== '0') {
    arr.push({
      name: '**Vanilla**',
      value: `**Supremacy:** ${roundBy(rating.s[0].points[0])}\n**DeathMatch**: ${roundBy(rating.d[0].points[0])}`,
      inline: true,
    });
  }
  if (rating.sy[0].points[0] !== '0'
    || rating.dy[0].points[0] !== '0'
    || rating.ty[0].points[0] !== '0') {
    arr.push({
      name: 'TAD',
      value: `**Supremacy:** ${roundBy(rating.sy[0].points[0])}\n**Treaty**: ${roundBy(rating.ty[0].points[0])}\n**DeathMatch**: ${roundBy(rating.dy[0].points[0])}`,
      inline: true,
    });
  }
  // TWC Rating, removed on suggestion of Buckethead
  // if (rating.sx[0].points[0] !== '0'
  //   || rating.dx[0].points[0] !== '0'
  //   || rating.tx[0].points[0] !== '0') {
  //   arr.push({
  //     name: 'TWC',
  //     value: `**Supremacy:** ${roundBy(rating.sx[0].points[0])}\n**Treaty**: ${roundBy(rating.tx[0].points[0])}\n**DeathMatch**: ${roundBy(rating.dx[0].points[0])}`,
  //     inline: true,
  //   });
  // }
  return arr;
}

module.exports = {
  name: 'player',
  description: 'Returns player stats',
  async execute(message, args) {
    const queryURL = ESO_QUERY.replace('arg1', args[0]);
    log(`Looking for player: '${args[0]}' in ${queryURL}`);
    let player = await request.get(queryURL);
    parseString(player, (err, result) => {
      player = result;
    });
    if (player.error !== undefined) {
      logError(`Player: ${args[0]} is not found on ESO servers`);
      message.channel.send('Please enter a valid ESO Name');
      return;
    }
    player = player.age3;
    let presence;
    let color;
    let dateOptions = {
      weekday: 'long',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
      second: 'numeric',
    };
    const rating = player.ratings[0];
    if (player.user[0].presence[0] === 'offline') {
      const lastLogin = new Date(player.user[0].lastLogin).toLocaleDateString('en-US', dateOptions);
      color = RED;
      presence = `**Last seen**: *${lastLogin}* `;
    } else {
      color = GREEN;
      presence = '**Online Now!**';
    }
    dateOptions = {
      weekday: 'long',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    };
    const joinDate = new Date(player.user[0].dateJoined);
    const embed = {
      title: `${(player.user[0].clanAbbr[0].trim() === '') ? '' : `[${player.user[0].clanAbbr[0]}] `}${escapeMarkdown(player.user[0].name)}`,
      description: `${presence}${(player.user[0].clanName[0].trim() === '') ? '' : `\n**Clan**: *${player.user[0].clanName}*\n**Member since**: *${joinDate.toLocaleDateString('en-US', dateOptions)}*`}`,
      url: 'https://discordapp.com',
      color,
      timestamp: `${player.LastUpdated}`,
      footer: {
        text: 'Last updated',
      },
      author: {
        name: 'ESO Player Info',
        icon_url: 'https://cdn.discordapp.com/embed/avatars/0.png',
      },
      fields: generateFields(rating),
    };
    message.channel.send({ embed })
      .catch(logError);
  },
};
