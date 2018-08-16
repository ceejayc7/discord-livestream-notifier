import _ from 'lodash';
import { BLACKLISTED_SERVERS } from './constants.js';
import { BOT_COMMANDS, SLOTS_MONEY } from './constants_internal.js';

function isBlacklistedChannel(msg) {
    const serverBlacklist = _.get(BLACKLISTED_SERVERS, msg.channel.guild.name);
    if(_.includes(serverBlacklist, msg.channel.name)) {
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

function getBlackjackBetsize(msg) {
    const betSizeSplit = msg.content.split(' ');

    if(betSizeSplit.length >= 2 && parseInt(betSizeSplit[1])) {
        return parseInt(betSizeSplit[1]);
    }
    return false;
}

function printSpecifyBetSize(msg) {
    Helpers.sendMessageToChannel(msg, `Usage: !21 <bet size>. Use !bitcoin to see how many bitcoins you have.`);
}

function printHelp(msg) {
    const MARKDOWN = "```",
        DIVIDER = `=============================================`,
        filteredBotCommands = _.map(_.filter(BOT_COMMANDS, (command) => {return command.showOnHelp}), 'command').join(' ');
    let messageToSend = "";

    messageToSend += `Current commands: **${filteredBotCommands}**\n`;
    messageToSend += `${MARKDOWN}perl\n`;
    messageToSend += `!slots\n${DIVIDER}\n`;
    messageToSend += ` - Costs ${SLOTS_MONEY.SLOTS_COST.toLocaleString()} Bitcoins\n`;
    messageToSend += ` + On double slots, you win ${SLOTS_MONEY.SLOTS_DOUBLE_REWARD.toLocaleString()} Bitcoins\n`;
    messageToSend += ` + On triple slots, you win ${SLOTS_MONEY.SLOTS_TRIPLE_REWARD.toLocaleString()} Bitcoins\n`;
    messageToSend += ` + On quad slots, you win ${SLOTS_MONEY.SLOTS_QUADS_REWARD.toLocaleString()} Bitcoins\n`;
    messageToSend += ` + On a slots win, you win ${SLOTS_MONEY.SLOTS_WIN_REWARD.toLocaleString()} Bitcoins\n`;
    messageToSend += `${MARKDOWN}`;

    messageToSend += `${MARKDOWN}\n`;
    messageToSend += `!21 <bet size>\n${DIVIDER}\n`;
    messageToSend += ` - No min/max bet size\n`;
    messageToSend += ` + Blackjack pays 3:2\n`;
    messageToSend += `${MARKDOWN}`;

    messageToSend += `${MARKDOWN}perl\n`;
    messageToSend += `!leaderboard\n${DIVIDER}\n`;
    messageToSend += ` + Display Bitcoin leaderboards\n`;
    messageToSend += ` + Everyone starts with 1,000 initial Bitcoins\n`;
    messageToSend += ` + You cannot go below ${SLOTS_MONEY.SLOTS_COST.toLocaleString()} Bitcoins\n`;
    messageToSend += `${MARKDOWN}`;
    
    sendMessageToChannel(msg, messageToSend);
}

export const Helpers = {
    isBlacklistedChannel,
    sendMessageToChannel,
    messageError,
    getListOfStreams,
    printHelp,
    getBlackjackBetsize,
    printSpecifyBetSize
};