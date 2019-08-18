import { Helpers } from './helpers';
import { MoneyManager } from './moneymanager';
import { Database } from './database';
import { PLAYERS } from './constants_internal';
import _ from 'lodash';

const weightedRandom = require('weighted-random'),
  fishLines = require('./fish.json');

function addRewardIfPossible(line, msg) {
  if (line.reward && line.reward > 0) {
    Database.initializeUser(msg.channel.guild.name, msg.author.username);
    MoneyManager.addMoney(msg, line.reward);
  }
}

function isFish(line) {
  if (line.fish) {
    return true;
  }
  return false;
}

function printLeaderboard(msg) {
  const template = `%INDEX%. %PLAYERNAME% has a %NUMBER% pound fish\n`,
    mapping = {
      '%INDEX%': 'index+1',
      '%PLAYERNAME%': 'player.name',
      '%NUMBER%': 'player.maxWeightFish.toLocaleString()'
    };
  Helpers.printLeaderboard(msg, ['maxWeightFish'], template, mapping, 'maxWeightFish');
}

function saveFishWeight(msg, weight) {
  const key = `/${msg.channel.guild.name}/${PLAYERS}/${msg.author.username}/maxWeightFish`,
    savedWeight = Database.getData(key);
  if (weight > savedWeight) {
    Database.writeData(key, weight);
  }
}

function getWeight(fishLineObj) {
  if (fishLineObj.exponential) {
    return Helpers.getRandomNumberInRangeWithExponentialDistribution(fishLineObj.minWeight);
  }
  return Helpers.getRandomNumberInRange(fishLineObj.minWeight, fishLineObj.maxWeight);
}

function printFishLine(msg) {
  const weightedProbability = _.map(fishLines, 'weightedProbability'),
    selection = weightedRandom(weightedProbability),
    fishLineObj = fishLines[selection];

  let chatLine = fishLineObj.chatLine;

  if (isFish(fishLineObj)) {
    const weight = getWeight(fishLineObj);
    chatLine += ` It weighs **${weight}** lbs`;
    saveFishWeight(msg, weight);
  }
  addRewardIfPossible(fishLineObj, msg);
  Helpers.sendMessageToChannel(msg, chatLine);
}

export const Fish = {
  printFishLine,
  printLeaderboard
};
