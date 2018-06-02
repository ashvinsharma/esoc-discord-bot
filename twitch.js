const request = require('request-promise');
const sleep = require('await-sleep');
const fs = require('fs');

const clientID = 'l075cyh5nw7b2savfoc46nleqh2sg6';
const twitchUrl = "https://www.twitch.tv/";
const apiTwitch = 'https://api.twitch.tv/helix/';
const apiUsers = 'users?id=';
const apiStreams = 'streams?game_id=10819';

const updateInterval = 60000;

const schedulesURL = 'http://eso-community.net/app.php/current-streams-schedule';

const optionsTwitch = {
    headers: {'Client-ID': clientID},
    json: true,
    timeout: '30'
};

const optionsSchedules = {
    uri: schedulesURL,
    timeout: '30',
    json: true
}

class Twitch {

    static _getStreams() {
        let data;

        try {
            data = request.get(apiTwitch + apiStreams, optionsTwitch);
        }
        catch (e) {
            console.log(e.message)
        }
        return data;
    }

    static _getSchedules() {
        let data;

        try {
            data = request.get(optionsSchedules);
        }
        catch (e) {
            console.log(e.message);
        }
        return data;
    }

    static _getUser(stuff) {
        let data;

        try {
            data = request.get(apiTwitch + apiUsers + stuff.toString(), optionsTwitch)
        }
        catch (e) {

        }
        return data;

    }

    static async Streams() {
        let cache;

        let streams;
        let schedules;


        while (1) {
            let streamsPromise = await this._getStreams().then(function (data) {
                // console.log(JSON.stringify(data));
                streams = data.data;
                console.log(JSON.stringify(streams))
            });
            let schedulesPromise = await this._getSchedules().then(function (data) {
                // console.log(JSON.stringify(data));
                schedules = data;
            });

            if (typeof streams != 'undefined') {
                console.log(JSON.stringify(streams));

                let data = {};

                for (data of streams) {
                    let userData;
                    let userPromise = await this._getUser(data.user_id).then(function (data) {
                        userData = data;
                    });
                    console.log(JSON.stringify(userData.data[0].display_name))
                }

            }
            await sleep(updateInterval);
        }
    }

    updateInfo(data) {
        this._stream = data;

        this._lastSeen = Date.now();


    }
}


module.exports = Twitch;