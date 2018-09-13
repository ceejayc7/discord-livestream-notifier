import _ from 'lodash';
import { WHITELISTED_SERVERS, SERVER_FOR_FISHING } from './constants.js';
import { BOT_COMMANDS, SLOTS_MONEY, PLAYERS } from './constants_internal.js';
import { Database } from './database.js';
import { Prob } from 'prob.js';

function isWhitelistedChannel(msg) {
    const serverWhitelist = _.get(WHITELISTED_SERVERS, msg.channel.guild.name);
    if(_.includes(serverWhitelist, msg.channel.name)) {
        return true;
    }
    return false;
}

function isFishingServer(msg) {
    const specificServer = SERVER_FOR_FISHING;
    if(msg.channel.guild.name === specificServer) {
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

function getRandomElementFromList(list) {
    return list[Math.floor(Math.random()*list.length)];
}

function printSpecifyBetSize(msg) {
    Helpers.sendMessageToChannel(msg, `Usage: !21 <bet size>. Use !bitcoin to see how many bitcoins you have.`);
}

function getRandomNumberInRange(min, max) {
    return parseInt(Math.random() * (max - min) + min);
}

function getRandomNumberInRangeWithExponentialDistribution(min) {
    const exponentialDistribution = Prob.exponential(1.0);
    let randomNumber = parseInt(exponentialDistribution()*100);
    while(randomNumber < min) {
        randomNumber = parseInt(exponentialDistribution()*100);
    }
    return randomNumber;
}

function printLeaderboard(msg, sortAttributes, printMessage, mapping, hideValue = undefined) {
    const serverData = Database.getData(`/${msg.channel.guild.name}/${PLAYERS}`),
        sorted = _.orderBy(serverData, sortAttributes, 'asc').reverse();
    let leaderboard = "```perl\n";

    _.forEach(sorted, (player, index) => {
        if(hideValue && _.has(player, hideValue) && player[hideValue] === 0) {
            return;
        }
        let template = printMessage;
        _.forEach(mapping, (value, key) => {
            template = _.replace(template, key, eval(value));
        });
        leaderboard += template;
    });

    leaderboard += "```";

    Helpers.sendMessageToChannel(msg, leaderboard);
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
    messageToSend += ` + Short-hand commands - ${BOT_COMMANDS.BLACKJACK_HIT_SHORTHAND.command} ${BOT_COMMANDS.BLACKJACK_DOUBLE_SHORTHAND.command} ${BOT_COMMANDS.BLACKJACK_STAND_SHORTHAND.command}\n`
    messageToSend += `${MARKDOWN}`;

    messageToSend += `${MARKDOWN}perl\n`;
    messageToSend += `!leaderboard\n${DIVIDER}\n`;
    messageToSend += ` + Display Bitcoin leaderboards\n`;
    messageToSend += ` + Everyone starts with 1,000 initial Bitcoins\n`;
    messageToSend += ` + You cannot go below ${SLOTS_MONEY.SLOTS_COST.toLocaleString()} Bitcoins\n`;
    messageToSend += ` + Short-hand commands - ${BOT_COMMANDS.LEADERBOARD_SHORTHAND.command}\n`;
    messageToSend += `${MARKDOWN}`;
    
    messageToSend += `${MARKDOWN}perl\n`;
    messageToSend += `!lotto\n${DIVIDER}\n`;
    messageToSend += ` + A random user is awarded between 1 & the max number of Bitcoins that a user has (aka first on !lb)\n`;
    messageToSend += ` + To become a lotto ticket holder, you must be online & on the leaderboard\n`;
    messageToSend += ` + Lotto cooldown is 24 hours\n`;
    messageToSend += ` + You have one minute to !claim after you have been selected as a winner`;
    messageToSend += `${MARKDOWN}`;

    sendMessageToChannel(msg, messageToSend);
}

export const Helpers = {
    isWhitelistedChannel,
    sendMessageToChannel,
    messageError,
    getListOfStreams,
    printHelp,
    getBlackjackBetsize,
    printSpecifyBetSize,
    getRandomElementFromList,
    isFishingServer,
    getRandomNumberInRange,
    getRandomNumberInRangeWithExponentialDistribution,
    printLeaderboard
};
