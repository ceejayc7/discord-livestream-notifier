import { Helpers } from './helpers.js';
import { MoneyManager } from './moneymanager';
import { Database } from './database.js';

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
    printFishLine
};
