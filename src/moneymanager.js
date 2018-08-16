import { Helpers } from './helpers.js';
import { Database } from './database.js';
import _ from 'lodash';
import { SLOTS_MONEY, MINIMUM_BITCOINS } from './constants_internal.js';

function printLeaderboard(msg) {
    const serverData = Database.getData(`/${msg.channel.guild.name}`),
        sorted = _.orderBy(serverData, ['money'], 'asc').reverse();
    let leaderboard = "```perl\n";

    _.forEach(sorted, (player, index) => {
        leaderboard += `${index+1}. ${player.name} has ${player.money.toLocaleString()} Bitcoins\n`;
    });

    leaderboard += "```";

    Helpers.sendMessageToChannel(msg, leaderboard);
}

function printMoney(msg) {
    const userMoney = getUsersMoney(msg);
    if(!userMoney) {
        Helpers.sendMessageToChannel(msg, `You have no bitcoins. Play a game to get some.`);
        return;
    }
    const messageToSend = `${msg.author.username} has **${userMoney.toLocaleString()}** Bitcoins`;
    Helpers.sendMessageToChannel(msg, messageToSend);
}

function getUserKey(msg) {
    return `/${msg.channel.guild.name}/${msg.author.username}/money`;
}

function getUsersMoney(msg) {
    const userMoneyKey = getUserKey(msg);
    return Database.getData(userMoneyKey);
}

function isEnoughMoney(msg, cost) {
    let money = getUsersMoney(msg);
    if(money >= cost) {
        return true;
    }
    printNotEnoughMoney(msg);
    return false;
}

function getBalanceForBlackjackDouble(msg, currentBetSize) {
    const DOUBLE = 2;
    let usersMoney = getUsersMoney(msg);
    if(currentBetSize*DOUBLE > usersMoney) {
        Helpers.sendMessageToChannel(msg, `Not enough money to double, going all-in with **${usersMoney}** Bitcoins!!!`);
        return usersMoney;
    }
    return currentBetSize*DOUBLE;
}

function printNotEnoughMoney(msg) {
    Helpers.sendMessageToChannel(msg, `You don't have enough bitcoins, sorry bro`);
}

function removeMoney(msg, cost) {
    let currentMoney = getUsersMoney(msg),
        newMoney = currentMoney - cost;
    if(newMoney < MINIMUM_BITCOINS) {
        newMoney = MINIMUM_BITCOINS;
    }
    Database.writeData(getUserKey(msg), newMoney);
}

function addMoney(msg, cost) {
    let currentMoney = getUsersMoney(msg);
    Database.writeData(getUserKey(msg), (currentMoney + cost));
}

function updateSlotsMoney(msg, count) {
    let currentMoney = getUsersMoney(msg);
    switch(count) {
        case 2:
            Database.writeData(getUserKey(msg), (currentMoney + SLOTS_MONEY.SLOTS_DOUBLE_REWARD));
            break;
        case 3:
            Database.writeData(getUserKey(msg), (currentMoney + SLOTS_MONEY.SLOTS_TRIPLE_REWARD));
            break;
        case 4:
            Database.writeData(getUserKey(msg), (currentMoney + SLOTS_MONEY.SLOTS_QUADS_REWARD));
            break;
        case 5:
            Database.writeData(getUserKey(msg), (currentMoney + SLOTS_MONEY.SLOTS_WIN_REWARD));
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
    getBalanceForBlackjackDouble
};