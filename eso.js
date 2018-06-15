const request = require('request')

class ESO {
    static async _getLobby(){
        const req = request('http://eso-community.net/assets/patch/api/lobbies.json')
    }
}

module.exports = ESO
