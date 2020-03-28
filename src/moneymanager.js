import { MINIMUM_BITCOINS, PLAYERS, SLOTS_MONEY } from '@root/constants_internal';

import { Database } from '@root/database';
import { Helpers } from '@root/helpers';

function printLeaderboard(msg) {
  const template = `%INDEX%. %PLAYERNAME% has %NUMBER% Bitcoins\n`;
  const mapping = {
    '%INDEX%': 'index+1',
    '%PLAYERNAME%': 'player.name',
    '%NUMBER%': 'player.money.toLocaleString()'
  };
  Helpers.printLeaderboard(msg, ['money'], template, mapping);
}

function printMoney(msg) {
  const userMoney = getUsersMoney(msg);
  if (!userMoney) {
    Helpers.sendMessageToChannel(msg, `You have no bitcoins. Play a game to get some.`);
    return;
  }
  const messageToSend = `${msg.author.username} has **${userMoney.toLocaleString()}** Bitcoins`;
  Helpers.sendMessageToChannel(msg, messageToSend);
}

function getUserKey(msg) {
  return `/${msg.channel.guild.name}/${PLAYERS}/${msg.author.username}/money`;
}

function getUsersMoney(msg) {
  const userMoneyKey = getUserKey(msg);
  return Database.getData(userMoneyKey);
}

function isEnoughMoney(msg, cost) {
  const money = getUsersMoney(msg);
  if (money >= cost) {
    return true;
  }
  return false;
}

function getBalanceForBlackjackDouble(msg, currentBetSize) {
  const DOUBLE = 2;
  const usersMoney = getUsersMoney(msg);
  if (currentBetSize * DOUBLE > usersMoney) {
    Helpers.sendMessageToChannel(
      msg,
      `Not enough money to double, going all-in with **${usersMoney}** Bitcoins!!!`
    );
    return usersMoney;
  }
  return currentBetSize * DOUBLE;
}

function printNotEnoughMoney(msg) {
  Helpers.sendMessageToChannel(msg, `You don't have enough bitcoins, sorry bro`);
}

function removeMoney(msg, cost) {
  const currentMoney = getUsersMoney(msg);
  let newMoney = currentMoney - cost;
  if (newMoney < MINIMUM_BITCOINS) {
    newMoney = MINIMUM_BITCOINS;
  }
  Database.writeData(getUserKey(msg), newMoney);
}

function addMoney(msg, cost) {
  const currentMoney = getUsersMoney(msg);
  Database.writeData(getUserKey(msg), currentMoney + cost);
}

function updateSlotsMoney(msg, count) {
  const currentMoney = getUsersMoney(msg);
  switch (count) {
    case 2:
      Database.writeData(getUserKey(msg), currentMoney + SLOTS_MONEY.SLOTS_DOUBLE_REWARD);
      break;
    case 3:
      Database.writeData(getUserKey(msg), currentMoney + SLOTS_MONEY.SLOTS_TRIPLE_REWARD);
      break;
    case 4:
      Database.writeData(getUserKey(msg), currentMoney + SLOTS_MONEY.SLOTS_QUADS_REWARD);
      break;
    case 5:
      Database.writeData(getUserKey(msg), currentMoney + SLOTS_MONEY.SLOTS_WIN_REWARD);
      break;
  }
}

export const MoneyManager = {
  printMoney,
  isEnoughMoney,
  updateSlotsMoney,
  removeMoney,
  printLeaderboard,
  addMoney,
  getBalanceForBlackjackDouble,
  printNotEnoughMoney
};
