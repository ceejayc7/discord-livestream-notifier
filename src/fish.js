import { Helpers } from './helpers.js';
import { MoneyManager } from './moneymanager';

function addRewardIfPossible(line, msg) {
    if(line.reward && line.reward > 0) {
        MoneyManager.addMoney(msg, line.reward);
    }
}

function printFishLine(msg) {
    const fishLines = require('./fish.json'),
        randomLine = Helpers.getRandomElementFromList(fishLines);
    Helpers.sendMessageToChannel(msg, randomLine.chatLine);
    addRewardIfPossible(randomLine, msg);
}

export const Fish = {
    printFishLine
};
