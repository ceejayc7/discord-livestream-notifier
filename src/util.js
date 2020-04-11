import { BOT_COMMANDS, LOTTO_MAX, SLOTS_MONEY } from '@root/constants';

import _ from 'lodash';

const CONSTANTS = require('@data/constants.json').serverConfig;

export const getKpopChannels = (discordBots) => {
  const channels = [];
  for (const server in CONSTANTS) {
    if (CONSTANTS[server]?.kpopChannels) {
      const discordChannels = CONSTANTS[server].kpopChannels;
      const discordServer = discordBots[server];

      for (const configuredChannel of discordChannels) {
        discordServer.client.channels.cache.forEach((channel) => {
          if (configuredChannel === channel.name) {
            channels.push(channel);
          }
        });
      }
    }
  }
  return _.compact(channels);
};

const isChannelType = (msg, channelConfig) => {
  if (channelConfig) {
    for (const channel of channelConfig) {
      if (channel === msg.channel.name) {
        return true;
      }
    }
  }
  return false;
};

export const isCasinoChannel = (msg) => {
  return isChannelType(msg, CONSTANTS?.[msg.guild.name]?.casinoChannels);
};

export const isKpopChannel = (msg) => {
  return isChannelType(msg, CONSTANTS?.[msg.guild.name]?.kpopChannels);
};

export const isFishingServer = (msg) => {
  return CONSTANTS?.[msg.guild.name]?.allowFishing && isCasinoChannel(msg);
};

export const isTweetingServer = (msg) => {
  return CONSTANTS?.[msg.guild.name]?.allowTweeting;
};

export const messageError = (error) => {
  console.log(
    `Unable to send message. \t Error name: ${error.name} \t Error message: ${error.message}`
  );
};

export const sendMessageToChannel = (msg, stringToSend) => {
  return msg.channel.send(stringToSend).catch(messageError);
};

export const printHelp = (msg) => {
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

export const decodeHTMLEntities = (encodedString) => {
  const translateRegex = /&(nbsp|amp|quot|lt|gt);/g;
  const translate = {
    nbsp: ' ',
    amp: '&',
    quot: '"',
    lt: '<',
    gt: '>',
  };
  return encodedString
    .replace(translateRegex, function (match, entity) {
      return translate[entity];
    })
    .replace(/&#(\d+);/gi, function (match, numStr) {
      const num = parseInt(numStr, 10);
      return String.fromCharCode(num);
    });
};

export const getCaseInsensitiveKey = (object, key) => {
  return Object.keys(object).find((k) => k.toLowerCase() === key.toLowerCase());
};
