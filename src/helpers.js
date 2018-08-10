import _ from 'lodash';

function getBlacklistedServers() {
    return {
        "silkroad" : "general",
        "pendulums" : "general",
        "#id3" : "general",
        "#id3" : "nsfw",
        "#id3" : "crypto",
        "#id3" : "crypto-signals"
    };
}

function isBlacklistedChannel(msg) {
    const blacklistedChannels = getBlacklistedServers();
    if(_.get(blacklistedChannels, msg.channel.guild.name) === msg.channel.name) {
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
