const request = require('request-promise');
const fs = require('fs');
const Discord = require('discord.js');
const constants = require('./constants');
const { log, logError } = require('./logger');

const { escapeMarkdown } = Discord.Util;
const prefixJsonData = 'user_';

class Twitch {
  static async getUserFromCache(userID) {
    log(`Look for user "${userID}" in user.json`);
    const user = prefixJsonData + userID;
    let file = fs.readFileSync('user.json', 'utf8');
    file = JSON.parse(file);
    if (file[user]) {
      log(`Found user "${userID}" in user.json`);
      return file[user];
    }
    log(`User "${userID}" does not exist in user.json, get from Twitch instead..`);
    return this.writeToCache(userID, user, file);
  }

  static async writeToCache(userID, user) {
    let data;
    const temp = null;
    try {
      const url = `${constants.TWITCH_API_URI}${constants.TWITCH_API_USERS_URI}${userID.toString()}`;
      log(`Fetch user"${userID}" from ${url}`);
      const res = await request.get(url, constants.TWITCH_OPTIONS)
        .catch(logError);
      log('Request successful, get data from response...');
      data = res.data[0]; // We are doing this
      data = JSON.stringify(data, ['id', 'login', 'display_name']); // to keep only
      data = JSON.parse(data); // the data we need.
      let info = {};
      info[user] = data;
      info = JSON.stringify(info, null, '  '); // Pretty stringify the object in JSON.
      log(`Write user "${userID}" to user.json..`);
      fs.writeFileSync('user.json', info); // We write back the object to the file.
      log('user.json saved..');
      return data;
    } catch (error) {
      logError(`Faled to fetch user "${userID}" from twitch and write to user.json. Error: ${error}`);
    }
    return temp;
  }

  static async getUser(userID) {
    log(`Fetching user "${userID}"`);
    let userData = null;
    let cacheUsers = null;
    if (fs.existsSync('user.json')) {
      try {
        cacheUsers = await this.getUserFromCache(userID);
        userData = cacheUsers;
      } catch (e) {
        logError(e);
      }
    } else {
      try {
        log('Could not find user.json with cached users, fetch from Twitch instead');
        const user = prefixJsonData + userID;
        userData = await this.writeToCache(userID, user);
      } catch (error) {
        logError(`Failed to fetch user "${userID}". Error: ${error}`);
      }
    }
    return userData;
  }

  static async getStream() {
    const url = `${constants.TWITCH_API_URI}${constants.TWITCH_API_STREAMS_URI}`;
    log(`Fetch streams from "${url}"...`);
    let res;
    try {
      res = await request(url, constants.TWITCH_OPTIONS);
    } catch (e) {
      logError(`StatusCodeError ${e.error.status} Message: ${e.error.message}`);
      return {
        error: e.error.message,
      };
    }
    log('Fetched streams successfully');
    const streams = res.data;
    const users = {};
    log('Fetching users...');
    await Promise.all(streams.map(((stream) => {
      users[`user_${stream.user_id}`] = this.getUser(stream.user_id);
    })))
      .catch(error => logError(`Failed to fetch users. Error: ${error}`));
    return {
      streams,
      users,
    };
  }

  static getImageURL(stream) {
    return `${(stream.thumbnail_url).replace('{height}', '768')
      .replace('{width}', '1366')}?${new Date().getMilliseconds()}`;
  }

  static async createEmbed(response, stream, user) {
    const url = `${constants.TWITCH}${user.login}`;
    const embedColor = (stream.viewer_count >= constants.GOLD_COUNT)
      ? constants.GOLD : constants.GRAY;
    const image = this.getImageURL(stream);
    return {
      title: `${url}`,
      color: `${embedColor}`,
      url: `${url}`,
      timestamp: `${stream.started_at}`,
      image: {
        url: image,
      },
      author: {
        name: `${user.display_name} is now streaming!`,
        url: `${url}`,
        icon_url: 'https://images-ext-1.discordapp.net/external/IZEY6CIxPwbBTk-S6KG6WSMxyY5bUEM-annntXfyqbw/https/cdn.discordapp.com/emojis/287637883022737418.png',
      },
      fields: [
        {
          name: 'Status',
          value: escapeMarkdown(stream.title),
          inline: true,
        },
        {
          name: 'Viewers',
          value: stream.viewer_count,
          inline: true,
        },
      ],
    };
  }
}

module.exports = Twitch;
