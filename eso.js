const request = require('request-promise')

class ESO {
    static async getLobby() {
        const req = await request('http://eso-community.net/assets/patch/api/lobbies2.json')
        return JSON.parse(req)
    }

    static getUserLink(player) {
        const epLadder = 'http://eso-community.net/ladder.php?patch=official&type=treaty&mode=overall&player='
        return epLadder + player
    }
}

module.exports = ESO
