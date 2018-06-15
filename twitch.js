const request = require('request-promise')
const fs = require('fs')
const clientID = 'l075cyh5nw7b2savfoc46nleqh2sg6'
const prefixJsonData = 'user_'
const apiTwitch = 'https://api.twitch.tv/helix/'
const apiUsers = 'users?id='
const apiStreams = 'streams?game_id=10819'
const schedulesURL = 'http://eso-community.net/app.php/current-streams-schedule'
const optionsTwitch = {
    headers: {
        'Client-ID': clientID
    },
    json: true,
    timeout: '30'
}
const optionsSchedules = {
    uri: schedulesURL,
    timeout: '30',
    json: true
}

class Twitch {
    static async getUserFromCache(userID) {
        const user = prefixJsonData + userID
        let writer = null
        let file = fs.readFileSync('user.json', 'utf8')
        file = JSON.parse(file)
        if (file[user]) return file[user]
        else {
            writer = await this.writeToCache(userID, user, file)
            return writer
        }
    }

    static async writeToCache(userID, user, file) {
        let data
        let req
        let temp = null
        try {
            req = request.get(apiTwitch + apiUsers + userID.toString(), optionsTwitch)
            let res = await req
            data = res.data[0]                                            //We are doing this
            data = JSON.stringify(data, ['id', 'login', 'display_name'])   // to keep only
            data = JSON.parse(data)                                        // the data we need.
            file[user] = data
            file = JSON.stringify(file, null, '  ') //Pretty stringify the object in JSON.
            fs.writeFileSync('user.json', file) //We write back the object to the file.
            return data
        } catch (e) {
            console.error(e.message)
        }
        return temp

    }

    static async getUser(userID) {
        let userData = null
        let cacheUsers = null
        if (fs.existsSync('user.json')) {
            cacheUsers = await this.getUserFromCache(userID)
            userData = cacheUsers
        } else {
            try {
                let user = prefixJsonData + userID
                let file = {}
                let writer
                writer = await this.writeToCache(userID, user, file)
                userData = writer
            } catch (e) {
                console.error(e)
            }
        }
        return userData

    }

    static async getStream() {
        const res = await request(apiTwitch + apiStreams, optionsTwitch)
        let streams = res.data
        let users = {}
        for (let stream of streams) {
            users['user_' + stream.user_id] = await this.getUser(stream.user_id)
        }
        return {streams, users}
    }
}

module.exports = Twitch