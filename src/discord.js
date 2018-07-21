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
    _.forEach(streamsList, (stream) => {
        setInterval(stream.updateStreams, 5000);
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

    //if(this.isLoggedIn) {
    //    this.client.channels.find('name','general').send('test');
    //}
});