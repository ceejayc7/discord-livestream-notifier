import _ from 'lodash';

function getBlacklistedServers() {
    return {
        "silkroad" : "general",
        "pendulums" : "general"
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

export const Helpers = {
    isBlacklistedChannel,
    sendMessageToChannel,
    messageError
};
