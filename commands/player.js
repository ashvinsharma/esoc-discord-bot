const request = require('request-promise');
const Discord = require('discord.js');
const parseString = require('xml2js').parseString;
const utf8 = require('utf8');
const {
  DEFAULT_AVATAR,
  ESOC,
  ESOC_AVATARS,
  ESO_QUERY,
  GREEN,
  RED,
} = require('./../constants');
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
  description: 'Returns ESO stats of player',
  usage: '[ESO account]',
  async execute(message, args) {
    if (typeof args[0] !== 'string') {
      message.channel.send('Please enter an ESO account to initiate search');
      return;
    }
    const avatar = args[1];
    const playerName = utf8.encode(args[0]);
    const queryURL = ESO_QUERY.replace('arg1', playerName);
    log(`Looking for player: '${playerName}' in ${queryURL}`);
    let player = await request.get(queryURL)
      .catch(logError);
    parseString(player, (err, result) => {
      player = result;
    });
    if (player.error !== undefined) {
      logError(`${player.error}. '${args[0]}' is not found on ESO servers.`);
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
    const avatarId = (player.user[0].avatarId[0] === '') ? '0c182d86-f9e0-4208-8074-0ce427e40a84' : player.user[0].avatarId[0];
    let url;
    try {
      url = `${ESOC}${ESOC_AVATARS}/${avatar[avatarId].imageName}`;
    } catch (error) {
      url = `${ESOC}${ESOC_AVATARS}/${avatar[DEFAULT_AVATAR].imageName}`;
    }
    const joinDate = new Date(player.user[0].dateJoined);
    const embed = {
      title: `${(player.user[0].clanAbbr[0].trim() === '') ? '' : `[${player.user[0].clanAbbr[0]}] `}${escapeMarkdown(player.user[0].name[0])}`,
      description: `${presence}${(player.user[0].clanName[0].trim() === '') ? '' : `\n**Clan**: *${player.user[0].clanName}*\n**Member since**: *${joinDate.toLocaleDateString('en-US', dateOptions)}*`}`,
      thumbnail: {
        url,
      },
      color,
      timestamp: `${player.LastUpdated}`,
      footer: {
        text: 'Last updated',
      },
      author: {
        name: 'ESO Player Info',
        icon_url: 'https://cdn.discordapp.com/attachments/264200488524840980/475604121051987968/ECB7F02F8BB013880A99FBCD398CFA93D9CB31C3.png',
      },
      fields: generateFields(rating),
    };
    message.channel.send({ embed })
      .catch(logError);
  },
};
