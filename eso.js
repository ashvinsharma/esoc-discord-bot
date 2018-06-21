const request = require('request-promise')
const con = require('./db.js')
const {db} = require('./config.json')

class ESO {
    static async getLobby() {
        const req = await request('http://eso-community.net/assets/patch/api/lobbies.json')
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

    static getMap(map) {
        switch (map) {
            case 'fastrandom':
                return 'Standard Maps'
            case 'asianrandom':
                return 'Asian Maps'
            default:
                return map
        }
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

    static getGameMode(mode, time, koth) {
        if (mode === 0) {
            if (time !== 0) return `Treaty ${time} min.`
            if (koth) return 'King Of the Hill'
            else return 'Supremacy'
        }
        else if (mode === 1) return 'Deathmatch'
    }

    static async getMapIcon(map) {
        // const getMap = `SELECT * FROM esoc.maps WHERE DisplayName=\'${map}\'`
        // let [rows, fields] = await con.execute(getMap)
        // if (rows.length !== 0 && rows[0].MiniMapUrl !== undefined)
        //     return `http://eso-community.net${rows[0].MiniMapUrl}`
        // else
        return 'https://media.discordapp.net/attachments/380115072548208660/457080365471760405/adirondacks.png?width=270&height=270'
    }
}

module.exports = ESO
