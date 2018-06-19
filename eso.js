const request = require('request-promise')

class ESO {
    static async getLobby() {
        const req = await request('http://eso-community.net/assets/patch/api/lobbies2.json')
        return JSON.parse(req)
    }

    static getUserLink(player, patch) {
        if (patch === 2)
            return `http://eso-community.net/ladder.php?patch=official&type=treaty&mode=overall&player=${player}`
        else
            return `http://eso-community.net/ladder.php?patch=esoc&type=supremacy&mode=overall&player=${player}`
    }

    static getPatch(patch) {
        if (patch === 1)
            return 'ESOC Patch'
        else if (patch === 2)
            return 'Treaty Patch'
        else if (patch === 3)
            return 'XP Mod'
    }

    static getPatchIcon(patch) {
        if (patch === 1)
            return 'http://eso-community.net/images/aoe3/patch-esoc-icon.png'
        else if (patch === 2)
            return 'http://eso-community.net/images/aoe3/patch-treaty-icon.png'
        else
            return null
    }

    static getEmbedColor(patch) {
        if (patch === 2)
            return 0x0378c0
        else
            return 0xc32025

    }
}

module.exports = ESO
