const request = require('request-promise');
const fs = require('fs');
const Discord = require('discord.js');
const constants = require('./constants');

const { escapeMarkdown } = Discord.Util;

class EsoActivity {
  static async getLobbies() {
    const req = await request(`${constants.ESOC}${constants.ESOC_LOBBIES_URI}`);
    try {
      return JSON.parse(req);
    } catch (e) {
      console.error(`${new Date()}: ${__filename}\n ${e}`);
      console.error(req);
      return [];
    }
  }

  static getUserLink(player, patch) {
    if (patch === 2) {
      return `${constants.ESOC_SUPREMACY_STANDARD_LADDER}${player}`;
    }
    return `${constants.ESOC_SUPREMACY_TREATY_LADDER}${player}`;
  }

  static getPatch(patch) {
    if (patch === 1) {
      return 'ESOC Patch';
    }
    if (patch === 2) {
      return 'Treaty Patch';
    }
    if (patch === 3) {
      return 'XP Mod';
    }
    return '';
  }

  static isPatch(patch) {
    return [1, 3].some(element => element === patch);
  }

  static getPatchIcon(patch) {
    if (patch === 1) return `${constants.ESOC}${constants.ESOC_PATCH_ICON}`;
    if (patch === 2) return `${constants.ESOC}${constants.TREATY_PATCH_ICON}`;
    return null;
  }

  static getEmbedColor(patch) {
    switch (patch) {
      case 1:
        return constants.ESOC_PATCH_EMBED_COLOR;
      case 2:
        return constants.TREATY_PATCH_EMBED_COLOR;
      case 3:
        return constants.XP_MOD_EMBED_COLOR;
      default:
        return constants.GRAY;
    }
  }

  static getGameMode(game) {
    if (game.game_mode === 0) {
      if (game.treaty_time !== 0) {
        let mode = `Treaty ${game.treaty_time} min.`;
        if (game.no_blockade) mode += ' No blockade';
        return mode;
      }
      if (game.koth) return 'King Of the Hill';
      return 'Supremacy';
    }
    if (game.game_mode === 1) return 'Deathmatch';
    return 'Not-found';
  }

  static getMap(map, patch) {
    switch (map) {
      case 'Largerandommaps':
        if (this.isPatch(patch)) return 'Classic Maps';
        return 'Large Maps';
      case 'asianrandom':
        if (this.isPatch(patch)) return 'ESOC Maps';
        return 'Asian Maps';
      case 'featured':
        if (this.isPatch(patch)) return 'KnB Maps';
        break;
      case 'fastrandom':
        return 'Standard Maps';
      case 'randommaps':
        if (this.isPatch(patch)) return 'Team Maps';
        return 'All Maps';
      default:
        return map;
    }
    return null;
  }

  static async getMapIcon(map, scenario, maps, unknownMaps) {
    if (scenario) return `${constants.ESOC}${constants.SCENARIO_IMAGE}`;
    const mapName = map.trim();
    let mapObject = maps[mapName];
    if (mapObject === undefined) {
      if (!unknownMaps.has(mapName)) {
        try {
          unknownMaps.add(mapName);
          fs.writeFile('maps_name.json', JSON.stringify([...unknownMaps], null, 2), (err) => {
            if (err) {
              console.error(`${new Date()}: ${__filename}\n ${err}`);
            }
          });
        } catch (e) {
          console.error(`${new Date()}: ${__filename}\n ${e}`);
        }
      }
      mapObject = maps[mapName.slice(0, 20)];
      if (mapObject === undefined) {
        try {
          mapObject = Object.entries(maps)
            .find(map => map[1].mapName.toLowerCase()
              .includes(mapName.toLowerCase()) || mapName.toLowerCase()
              .includes(map[1].mapName.toLowerCase()))[1];
        } catch (e) {
          console.error(`${new Date()}: ${__filename}\n ${e}`);
          return `${constants.ESOC}${constants.UNKNOWN_MAP_IMAGE}`;
        }
      }
    }
    let url = mapObject.MiniMapUrl;
    if (url[0] !== '/') url = `/${url}`;
    url = `${constants.ESOC}${url}`;
    return url;
  }

  static async createEmbed(game, maps, unknownMaps) {
    let count = 0;
    game.players.map((p) => {
      if (p === null) count += 1;
    });
    let map = this.getMap(game.map, game.patch);
    if (map[0] === map[0].toLowerCase()) {
      map = map[0].toUpperCase() + map.slice(1);
    }
    return {
      title: escapeMarkdown(game.name),
      url: this.getUserLink(game.players[0], game.patch),
      color: this.getEmbedColor(game.patch),
      // 'timestamp': date.toISOString(),
      // 'footer': {
      //     'icon_url': '',
      //     'text': `Created At`
      // },
      thumbnail: {
        url: await this.getMapIcon(map, game.scenario, maps, unknownMaps),
      },
      image: {
        url: '',
      },
      author: {
        name: this.getPatch(game.patch),
        icon_url: await this.getPatchIcon(game.patch),
      },
      fields: [
        {
          name: 'Host',
          value: escapeMarkdown(game.players[0]),
          inline: true,
        },
        {
          name: 'Players',
          value: `${8 - count}/${game.max_players}`,
          inline: true,
        },
        {
          name: 'Map',
          value: escapeMarkdown(map),
          inline: true,
        },
        {
          name: 'Game mode',
          value: this.getGameMode(game),
          inline: true,
        },
      ],
    };
  }
}

module.exports = EsoActivity;
