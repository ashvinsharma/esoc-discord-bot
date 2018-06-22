const request = require('request-promise');
const fs = require('fs');

const clientID = 'l075cyh5nw7b2savfoc46nleqh2sg6';
const prefixJsonData = 'user_';
const apiTwitch = 'https://api.twitch.tv/helix/';
const apiUsers = 'users?id=';
const apiStreams = 'streams?game_id=10819';
const optionsTwitch = {
  headers: {
    'Client-ID': clientID,
  },
  json: true,
  timeout: '30',
};
const twitchUrl = 'https://www.twitch.tv/';
const GRAY = 0x4f545c;
const GOLD = 0xffa500;
const GOLD_COUNT = 25;

class Twitch {
  static async getUserFromCache(userID) {
    const user = prefixJsonData + userID;
    let file = fs.readFileSync('user.json', 'utf8');
    file = JSON.parse(file);
    if (file[user]) {
      return file[user];
    }
    return this.writeToCache(userID, user, file);
  }

  static async writeToCache(userID, user) {
    let data;
    const temp = null;
    try {
      const res = await request.get(apiTwitch + apiUsers + userID.toString(), optionsTwitch);
      data = res.data[0]; // We are doing this
      data = JSON.stringify(data, ['id', 'login', 'display_name']); // to keep only
      data = JSON.parse(data); // the data we need.
      let info = {};
      info[user] = data;
      info = JSON.stringify(info, null, '  '); // Pretty stringify the object in JSON.
      fs.writeFileSync('user.json', info); // We write back the object to the file.
      return data;
    } catch (e) {
      console.error(`${new Date()} `, e);
    }
    return temp;
  }

  static async getUser(userID) {
    let userData = null;
    let cacheUsers = null;
    if (fs.existsSync('user.json')) {
      cacheUsers = await this.getUserFromCache(userID);
      userData = cacheUsers;
    } else {
      try {
        const user = prefixJsonData + userID;
        userData = await this.writeToCache(userID, user);
      } catch (e) {
        console.error(`${new Date()} `, e);
      }
    }
    return userData;
  }

  static async getStream() {
    const res = await request(apiTwitch + apiStreams, optionsTwitch);
    const streams = res.data;
    const users = {};
    await Promise.all(streams.map(((stream) => {
      users[`user_${stream.user_id}`] = this.getUser(stream.user_id);
    })))
      .catch(e => console.error(`${new Date()} `, e));
    return {
      streams,
      users,
    };
  }

  static async createEmbed(response, stream, user) {
    const url = `${twitchUrl}${user.login}`;
    const embedColor = (stream.viewer_count >= GOLD_COUNT) ? GOLD : GRAY;
    return {
      title: `${url}`,
      color: `${embedColor}`,
      url: `${url}`,
      timestamp: `${stream.started_at}`,
      image: {
        url: `${(stream.thumbnail_url).replace('{height}', '768')
          .replace('{width}', '1366')}`,
      },
      author: {
        name: `${user.display_name} is streaming `,
        url: `${url}`,
        icon_url: 'https://images-ext-1.discordapp.net/external/IZEY6CIxPwbBTk-S6KG6WSMxyY5bUEM-annntXfyqbw/https/cdn.discordapp.com/emojis/287637883022737418.png',
      },
      fields: [
        {
          name: 'Status',
          value: `${stream.title}`,
          inline: true,
        },
        {
          name: 'Viewers',
          value: `${stream.viewer_count}`,
          inline: true,
        },
      ],
    };
  }
}

module.exports = Twitch;
