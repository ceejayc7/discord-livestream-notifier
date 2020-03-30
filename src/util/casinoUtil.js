import { Database } from '@root/database';
import { PLAYERS } from '@root/constants_internal';
import { Prob } from 'prob.js';
import _ from 'lodash';
import { sendMessageToChannel } from '@util/util';

export const getBlackjackBetsize = (msg) => {
  const betSizeSplit = msg.content.split(' ');

  if (betSizeSplit.length >= 2 && parseInt(betSizeSplit[1])) {
    return parseInt(betSizeSplit[1]);
  }
  return false;
};

export const printSpecifyBetSize = (msg) => {
  sendMessageToChannel(
    msg,
    `Usage: !21 <bet size>. Use !bitcoin to see how many bitcoins you have.`
  );
};

export const getRandomElementFromList = (list) => {
  return list[Math.floor(Math.random() * list.length)];
};

export const getRandomNumberInRange = (min, max) => {
  return parseInt(Math.random() * (max - min) + min);
};

export const getRandomNumberInRangeWithExponentialDistribution = (min) => {
  const exponentialDistribution = Prob.exponential(1.0);
  let randomNumber = parseInt(exponentialDistribution() * 100);
  while (randomNumber < min) {
    randomNumber = parseInt(exponentialDistribution() * 100);
  }
  return randomNumber;
};

export const printLeaderboard = (
  msg,
  sortAttributes,
  printMessage,
  mapping,
  hideValue = undefined
) => {
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

  sendMessageToChannel(msg, leaderboard);
};
