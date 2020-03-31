import {
  getRandomNumberInRange,
  getRandomNumberInRangeWithExponentialDistribution,
  printLeaderboard
} from '@casino/util';

import { Database } from '@root/database';
import { MoneyManager } from '@casino/moneymanager';
import { PLAYERS } from '@root/constants_internal';
import _ from 'lodash';
import { sendMessageToChannel } from '@root/util';

const weightedRandom = require('weighted-random');
const fishLines = require('@data/fish.json');

const addRewardIfPossible = (line, msg) => {
  if (line.reward && line.reward > 0) {
    Database.initializeUser(msg.channel.guild.name, msg.author.username);
    MoneyManager.addMoney(msg, line.reward);
  }
};

const isFish = (line) => {
  if (line.fish) {
    return true;
  }
  return false;
};

const printFishingLeaderboard = (msg) => {
  const template = `%INDEX%. %PLAYERNAME% has a %NUMBER% pound fish\n`;
  const mapping = {
    '%INDEX%': 'index+1',
    '%PLAYERNAME%': 'player.name',
    '%NUMBER%': 'player.maxWeightFish.toLocaleString()'
  };
  printLeaderboard(msg, ['maxWeightFish'], template, mapping, 'maxWeightFish');
};

const saveFishWeight = (msg, weight) => {
  const key = `/${msg.channel.guild.name}/${PLAYERS}/${msg.author.username}/maxWeightFish`;
  const savedWeight = Database.getData(key);
  if (weight > savedWeight) {
    Database.writeData(key, weight);
  }
};

const getWeight = (fishLineObj) => {
  if (fishLineObj.exponential) {
    return getRandomNumberInRangeWithExponentialDistribution(fishLineObj.minWeight);
  }
  return getRandomNumberInRange(fishLineObj.minWeight, fishLineObj.maxWeight);
};

const printFishLine = (msg) => {
  const weightedProbability = _.map(fishLines, 'weightedProbability');
  const selection = weightedRandom(weightedProbability);
  const fishLineObj = fishLines[selection];

  let chatLine = fishLineObj.chatLine;

  if (isFish(fishLineObj)) {
    const weight = getWeight(fishLineObj);
    chatLine += ` It weighs **${weight}** lbs`;
    saveFishWeight(msg, weight);
  }
  addRewardIfPossible(fishLineObj, msg);
  sendMessageToChannel(msg, chatLine);
};

export const Fish = {
  printFishLine,
  printLeaderboard: printFishingLeaderboard
};
