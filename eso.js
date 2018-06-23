const request = require('request-promise');
const { maps } = require('./game_details');

class ESO {
  static async getLobbies() {
    const req = await request('http://eso-community.net/assets/patch/api/lobbies.json');
    return JSON.parse(req);
  }

  static getUserLink(player, patch) {
    if (patch === 2) {
      return `http://eso-community.net/ladder.php?patch=official&type=treaty&mode=overall&player=${player}`;
    }
    return `http://eso-community.net/ladder.php?patch=esoc&type=supremacy&mode=overall&player=${player}`;
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
    return [1, 2, 3].some(element => element === patch);
  }

  static getPatchIcon(patch) {
    if (patch === 1) {
      return 'http://eso-community.net/images/aoe3/patch-esoc-icon.png';
    }
    if (patch === 2) {
      return 'http://eso-community.net/images/aoe3/patch-treaty-icon.png';
    }
    return null;
  }

  static getEmbedColor(patch) {
    if (patch === 2) {
      return 0x0378c0;
    }
    return 0xc32025;
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

  static async getMapIcon(map) {
    const mapName = map.trim();
    const mapObject = maps.find(map => map.DisplayName.toLowerCase()
      .includes(mapName.toLowerCase()) || mapName.toLowerCase()
      .includes(map.DisplayName.toLowerCase()));
    if (mapObject === undefined) {
      console.log(map);
      return 'https://cdn.discordapp.com/attachments/275035741678075905/282788163272048640/unknown.png';
    }
    let url = mapObject.MiniMapUrl;
    if (url[0] !== '/') url = `/${url}`;
    url = `http://eso-community.net${url}`;
    return url;
  }

  static async createEmbed(game) {
    let count = 0;
    game.players.map((p) => {
      if (p === null) count += 1;
    });
    const map = this.getMap(game.map, game.patch);
    return {
      title: game.name,
      url: this.getUserLink(game.players[0], game.patch),
      color: this.getEmbedColor(game.patch),
      // 'timestamp': date.toISOString(),
      // 'footer': {
      //     'icon_url': '',
      //     'text': `Created At`
      // },
      thumbnail: {
        url: await this.getMapIcon(map),
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
          value: `${game.players[0]}`,
          inline: true,
        },
        {
          name: 'Players',
          value: `${8 - count}/${game.max_players}`,
          inline: true,
        },
        {
          name: 'Map',
          value: map,
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

module.exports = ESO;
