import Bot from './bot.js';
import Twitch from './twitch.js';
import {EventEmitter} from 'events';
import {DISCORD_TOKENS} from './constants.js';
import _ from 'lodash';

const streamEmitter = new EventEmitter(),
    serverDatabase = require('./db.json'),
    serverList = Object.keys(serverDatabase),
    discordBots = {},
    streamsList = [];

function initBots() {
    // create new bot per each defined discord server
    _.forEach(serverList, (server) => {
        let loginToken = _.get(DISCORD_TOKENS, server);
        if(loginToken) {
            discordBots[server] = new Bot(loginToken);
            discordBots[server].attachListeners();
            discordBots[server].loginToDiscord();
        }
    });

    const twitch = new Twitch(streamEmitter);
    streamsList.push(twitch);
}

function setTimers() {
    const TIME_TO_PING_API = 300000,
        FIRST_API_PING = 30000;
    _.forEach(streamsList, (stream) => {
        setInterval(stream.updateStreams, TIME_TO_PING_API); // continously call API refresh every 5 minutes
        setTimeout(stream.updateStreams, FIRST_API_PING); // on inital timer set, call API after 30 seconds to allow discord bots to log in
    });
}

initBots();
setTimers();

streamEmitter.on('event:streamlive', (stream) => {
    _.forEach(serverDatabase, (server, serverName) => {
        let isChannelInServer = _.includes(_.get(server,[stream.platform]), stream.name);
        if(isChannelInServer) {
            console.log(`${stream.name} went live, notifying channel`);
            discordBots[serverName].sendLiveMessage(stream);
        }
    });
});