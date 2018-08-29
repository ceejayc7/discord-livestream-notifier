import { Helpers } from './helpers.js';
import { MoneyManager } from './moneymanager';
import { Database } from './database.js';
import _ from 'lodash';

function addRewardIfPossible(line, msg) {
    if(line.reward && line.reward > 0) {
        MoneyManager.addMoney(msg, line.reward);
    }
}

function isFish(line) {
    if(line.fish) {
        return true;
    }
    return false;
}

function printLeaderboard(msg) {
    const serverData = Database.getData(`/${msg.channel.guild.name}`),
        sorted = _.orderBy(serverData, ['maxWeightFish'], 'asc').reverse();
    let leaderboard = "```perl\n";

    _.forEach(sorted, (player, index) => {
        leaderboard += `${index+1}. ${player.name} has a ${player.maxWeightFish.toLocaleString()} pound fish\n`;
    });

    leaderboard += "```";

    Helpers.sendMessageToChannel(msg, leaderboard);
}

function saveFishWeight(msg, weight) {
    const key = `/${msg.channel.guild.name}/${msg.author.username}/maxWeightFish`,
        savedWeight = Database.getData(key);
    if(weight > savedWeight) {
        Database.writeData(key, weight);
    }
}

function printFishLine(msg) {
    const fishLines = require('./fish.json'),
        fishLineObj = Helpers.getRandomElementFromList(fishLines);

    let chatLine = fishLineObj.chatLine;

    if(isFish(fishLineObj)) {
        const weight = Helpers.getRandomNumberInRange(fishLineObj.minWeight, fishLineObj.maxWeight);
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
