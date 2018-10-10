import { Database } from './database.js';
import { PLAYERS, LOTTO, LOTTO_MAX } from './constants_internal.js';
import { Helpers } from './helpers.js';
import { MoneyManager } from './moneymanager.js';
import _ from 'lodash';

let isWinner,
    winnerObject,
    winnerTimeout,
    jackpot;

function getOnlineUsersList(msg) {
    const onlineUsers = msg.guild.members.array().filter(user => { return user.presence.status !== "offline" && user.user.bot === false }),
        onlineUsernameList = onlineUsers.map(user => {return user.user.username});
    return onlineUsernameList;
}

function sendStartingMessage(msg, eligibleLottoUsers) {
    let initialMessage = '';
    initialMessage += `Today's jackpot is **${jackpot.toLocaleString()}** Bitcoins! Wow!!!\n`
    initialMessage += `The ticket holders are: **${eligibleLottoUsers.join(' ')}**\n`;
    initialMessage += `and the winner is........`;
    Helpers.sendMessageToChannel(msg, initialMessage);
}

function missedClaim(msg) {
    Helpers.sendMessageToChannel(msg, "Nobody claimed the jackpot!!!! Better luck next time bros");
    clearGlobals();
}

function printWinner(msg) {
    const ONE_MINUTE = 60000;
    Helpers.sendMessageToChannel(msg, `${winnerObject} has won!!! Type !claim to claim your jackpot`);
    winnerTimeout = setTimeout(() => missedClaim(msg), ONE_MINUTE);
}

function isNewLottoPlayer(msg, userLottoLottoKey) {
    const userID = Database.getData(userLottoLottoKey);
    if(userID === msg.author.id) {
        return false;
    }
    return true;
}

function isEligibleLottoEvent(msg) {
    const timeToNextLottoKey = `/${msg.channel.guild.name}/${LOTTO}/timeToNextLotto`,
        userLottoLottoKey = `/${msg.channel.guild.name}/${LOTTO}/userID`,
        timeToNextLotto = Database.getData(timeToNextLottoKey),
        currentTime = parseInt(new Date().getTime()/1000),
        ONE_DAY = 86400,
        isNewPlayer = isNewLottoPlayer(msg, userLottoLottoKey);

    if(currentTime > timeToNextLotto) {
        if(isNewPlayer) {
            Database.writeData(timeToNextLottoKey, currentTime+ONE_DAY);
            Database.writeData(userLottoLottoKey, msg.author.id);
            return true;
        }
        else {
            Helpers.sendMessageToChannel(msg, `Hey bro, give someone else a chance!`);
        }
    }
    else {
        Helpers.sendMessageToChannel(msg, `Sorry bro, !lotto is on cooldown. Try again later`);
    }
    return false;
}

function startLotto(msg) {
    if(!isEligibleLottoEvent(msg)) {
        return;
    }

    const FIVE_SECONDS = 5000,
        serverData = Database.getData(`/${msg.channel.guild.name}/${PLAYERS}`),
        //maxBitcoinCount = _.first(_.orderBy(serverData, 'money', 'asc').reverse()).money,
        onlineUsers = getOnlineUsersList(msg),
        serverUsers = _.map(serverData, 'name'),
        eligibleLottoUsers = _.intersection(onlineUsers, serverUsers),
        winner = Helpers.getRandomElementFromList(eligibleLottoUsers);

    winnerObject = _.head(msg.guild.members.array().filter(user => { return user.user.username === winner }));
    jackpot = Helpers.getRandomNumberInRange(1, LOTTO_MAX);
    isWinner = true;

    sendStartingMessage(msg, eligibleLottoUsers);

    setTimeout(() => printWinner(msg), FIVE_SECONDS);
}

function clearGlobals() {
    clearTimeout(winnerTimeout);
    isWinner = false;
    winnerObject = null;
    jackpot = null;
}

function claimLotto(msg) {
    if(isWinner && winnerObject.user.id === msg.author.id) {
        Helpers.sendMessageToChannel(msg, `Congrats to ${msg.author.username}. You have been awarded **${jackpot.toLocaleString()}** Bitcoins. See you next time bros`);
        MoneyManager.addMoney(msg, jackpot);
        clearGlobals();
    }
}

export const Lotto = {
    startLotto,
    claimLotto
};
