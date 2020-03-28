import { BOT_COMMANDS, LOTTO_MAX, PLAYERS, SLOTS_MONEY } from '@root/constants_internal';
import { SERVER_FOR_FISHING, WHITELISTED_SERVERS } from '@root/constants';

import { Database } from '@root/database';
import { Prob } from 'prob.js';
import _ from 'lodash';

const isWhitelistedChannel = (msg) => {
  const serverWhitelist = _.get(WHITELISTED_SERVERS, msg.channel.guild.name);
  if (_.includes(serverWhitelist, msg.channel.name)) {
    return true;
  }
  return false;
};

const isFishingServer = (msg) => {
  const specificServer = SERVER_FOR_FISHING;
  if (msg.channel.guild.name === specificServer) {
    return true;
  }
  return false;
};

const messageError = (error) => {
  console.log(
    `Unable to send message. \t Error name: ${error.name} \t Error message: ${error.message}`
  );
};

const apiError = (platform, error) => {
  console.log(
    `${platform} API error. \t Error name: ${error.name} \t Error message: ${error.message}`
  );
};

const sendMessageToChannel = (msg, stringToSend) => {
  return msg.channel.send(stringToSend).catch(messageError);
};

const getListOfStreams = (streamSite) => {
  const streamsDatabase = require('@root/db.json');
  return _.uniq(_.compact(_.flatten(_.map(streamsDatabase, streamSite))));
};

const addQueryParamToList = (queryParam, listOfStreams) => {
  const newList = [];
  listOfStreams.forEach((stream) => newList.push(`&${queryParam}=${stream}`));
  return newList;
};

const retrieveLiveChannels = (className, channelData) => {
  if (!_.isEmpty(channelData)) {
    _.forEach(channelData, (stream) => className.announceIfStreamIsNew(stream));
  }
  className.currentLiveStreams = channelData;
};

const announceIfStreamIsNew = (stream) => {
  const currentLiveChannels = _.map(this.currentLiveStreams, 'name');
  if (!_.includes(currentLiveChannels, stream.name)) {
    this.streamEmitter.emit('event:streamlive', stream);
  }
};

const getBlackjackBetsize = (msg) => {
  const betSizeSplit = msg.content.split(' ');

  if (betSizeSplit.length >= 2 && parseInt(betSizeSplit[1])) {
    return parseInt(betSizeSplit[1]);
  }
  return false;
};

const getRandomElementFromList = (list) => {
  return list[Math.floor(Math.random() * list.length)];
};

const printSpecifyBetSize = (msg) => {
  Helpers.sendMessageToChannel(
    msg,
    `Usage: !21 <bet size>. Use !bitcoin to see how many bitcoins you have.`
  );
};

const getRandomNumberInRange = (min, max) => {
  return parseInt(Math.random() * (max - min) + min);
};

const getRandomNumberInRangeWithExponentialDistribution = (min) => {
  const exponentialDistribution = Prob.exponential(1.0);
  let randomNumber = parseInt(exponentialDistribution() * 100);
  while (randomNumber < min) {
    randomNumber = parseInt(exponentialDistribution() * 100);
  }
  return randomNumber;
};

const printLeaderboard = (msg, sortAttributes, printMessage, mapping, hideValue = undefined) => {
  const serverData = Database.getData(`/${msg.channel.guild.name}/${PLAYERS}`);
  const sorted = _.orderBy(serverData, sortAttributes, 'asc').reverse();
  let leaderboard = '```perl\n';

  _.forEach(sorted, (player, index) => {
    if (hideValue && _.has(player, hideValue) && player[hideValue] === 0) {
      return;
    }
    let template = printMessage;
    _.forEach(mapping, (value, key) => {
      template = _.replace(template, key, eval(value));
    });
    leaderboard += template;
  });

  leaderboard += '```';

  Helpers.sendMessageToChannel(msg, leaderboard);
};

const printHelp = (msg) => {
  const MARKDOWN = '```';
  const DIVIDER = `=============================================`;
  const filteredBotCommands = _.map(
    _.filter(BOT_COMMANDS, (command) => {
      return command.showOnHelp;
    }),
    'command'
  ).join(' ');
  let messageToSend = '';

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
  // prettier-ignore
  messageToSend += ` + Short-hand commands - ${BOT_COMMANDS.BLACKJACK_HIT_SHORTHAND.command} ${BOT_COMMANDS.BLACKJACK_DOUBLE_SHORTHAND.command} ${BOT_COMMANDS.BLACKJACK_STAND_SHORTHAND.command}\n`;
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
  messageToSend += ` + A random user is awarded between 1 & ${LOTTO_MAX.toLocaleString()} BTC\n`;
  messageToSend += ` + To become a lotto ticket holder, you must be online & on the leaderboard\n`;
  messageToSend += ` + Lotto cooldown is 24 hours\n`;
  messageToSend += ` + You have one minute to !claim after you have been selected as a winner`;
  messageToSend += `${MARKDOWN}`;

  sendMessageToChannel(msg, messageToSend);
};

const decodeHTMLEntities = (encodedString) => {
  const translateRegex = /&(nbsp|amp|quot|lt|gt);/g;
  const translate = {
    nbsp: ' ',
    amp: '&',
    quot: '"',
    lt: '<',
    gt: '>'
  };
  return encodedString
    .replace(translateRegex, function(match, entity) {
      return translate[entity];
    })
    .replace(/&#(\d+);/gi, function(match, numStr) {
      const num = parseInt(numStr, 10);
      return String.fromCharCode(num);
    });
};

const getCaseInsensitiveKey = (object, key) => {
  return Object.keys(object).find((k) => k.toLowerCase() === key.toLowerCase());
};

export const Helpers = {
  isWhitelistedChannel,
  sendMessageToChannel,
  messageError,
  getListOfStreams,
  addQueryParamToList,
  printHelp,
  getBlackjackBetsize,
  printSpecifyBetSize,
  getRandomElementFromList,
  isFishingServer,
  getRandomNumberInRange,
  getRandomNumberInRangeWithExponentialDistribution,
  printLeaderboard,
  apiError,
  retrieveLiveChannels,
  announceIfStreamIsNew,
  decodeHTMLEntities,
  getCaseInsensitiveKey
};
