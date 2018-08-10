import _ from 'lodash';
import {BLACKLISTED_SERVERS} from './constants.js';

function isBlacklistedChannel(msg) {
    if(_.get(BLACKLISTED_SERVERS, msg.channel.guild.name) === msg.channel.name) {
        return true;
    }
    return false;
}

function messageError(error) {
    console.log(`Unable to send message. ${error.message}`);
}

function sendMessageToChannel(msg, stringToSend) {
    return msg.channel.send(stringToSend)
        .catch(messageError);
}

function getListOfStreams(streamSite) {
    const streamsDatabase = require('./db.json');
    return _.uniq(_.compact(_.flatten(_.map(streamsDatabase, streamSite))));
}

export const Helpers = {
    isBlacklistedChannel,
    sendMessageToChannel,
    messageError,
    getListOfStreams
};
