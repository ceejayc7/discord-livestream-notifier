import { LOTTO, LOTTO_MAX, PLAYERS } from '@root/constants_internal';

import { Database } from '@root/database';
import { Helpers } from '@root/helpers';
import { MoneyManager } from '@root/moneymanager';
import _ from 'lodash';

let isWinner;
let winnerObject;
let winnerTimeout;
let jackpot;
let inLottoWaiting = false;

function getOnlineUsersList(msg) {
  const onlineUsers = msg.guild.members.cache
    .array()
    .filter((user) => user.presence.status !== 'offline' && user.user.bot === false);
  const onlineUsernameList = onlineUsers.map((user) => {
    return user.user.username;
  });
  return onlineUsernameList;
}

function sendStartingMessage(msg, eligibleLottoUsers) {
  let initialMessage = '';
  initialMessage += `Today's jackpot is **${jackpot.toLocaleString()}** Bitcoins! Wow!!!\n`;
  initialMessage += `The ticket holders are: **${eligibleLottoUsers.join(' ')}**\n`;
  initialMessage += `and the winner is........`;
  Helpers.sendMessageToChannel(msg, initialMessage);
}

function missedClaim(msg) {
  Helpers.sendMessageToChannel(msg, 'Nobody claimed the jackpot!!!! Better luck next time bros');
  clearGlobals();
}

function printWinner(msg) {
  const ONE_MINUTE = 60000;
  inLottoWaiting = false;
  Helpers.sendMessageToChannel(msg, `${winnerObject} has won!!! Type !claim to claim your jackpot`);
  winnerTimeout = setTimeout(() => missedClaim(msg), ONE_MINUTE);
}

function isNewLottoPlayer(msg, userLottoLottoKey) {
  const userID = Database.getData(userLottoLottoKey);
  if (userID === msg.author.id) {
    return false;
  }
  return true;
}

function isEligibleLottoEvent(msg) {
  const timeToNextLottoKey = `/${msg.channel.guild.name}/${LOTTO}/timeToNextLotto`;
  const userLottoLottoKey = `/${msg.channel.guild.name}/${LOTTO}/userID`;
  const timeToNextLotto = Database.getData(timeToNextLottoKey);
  const currentTime = parseInt(new Date().getTime() / 1000);
  const ONE_DAY = 86400;
  const isNewPlayer = isNewLottoPlayer(msg, userLottoLottoKey);

  if (currentTime > timeToNextLotto) {
    if (isNewPlayer) {
      Database.writeData(timeToNextLottoKey, currentTime + ONE_DAY);
      Database.writeData(userLottoLottoKey, msg.author.id);
      return true;
    } else {
      Helpers.sendMessageToChannel(msg, `Hey bro, give someone else a chance!`);
    }
  } else {
    Helpers.sendMessageToChannel(msg, `Sorry bro, !lotto is on cooldown. Try again later`);
  }
  return false;
}

function startLotto(msg) {
  if (!isEligibleLottoEvent(msg)) {
    return;
  }

  const FIVE_SECONDS = 5000;
  const serverData = Database.getData(`/${msg.channel.guild.name}/${PLAYERS}`);
  // maxBitcoinCount = _.first(_.orderBy(serverData, 'money', 'asc').reverse()).money,
  const onlineUsers = getOnlineUsersList(msg);
  const serverUsers = _.map(serverData, 'name');
  const eligibleLottoUsers = _.intersection(onlineUsers, serverUsers);
  const winner = Helpers.getRandomElementFromList(eligibleLottoUsers);

  inLottoWaiting = true;
  winnerObject = _.head(
    msg.guild.members.cache.array().filter((user) => user.user.username === winner)
  );
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
  inLottoWaiting = false;
}

function claimLotto(msg) {
  if (isWinner && winnerObject.user.id === msg.author.id && !inLottoWaiting) {
    Helpers.sendMessageToChannel(
      msg,
      `Congrats to ${
        msg.author.username
      }. You have been awarded **${jackpot.toLocaleString()}** Bitcoins. See you next time bros`
    );
    MoneyManager.addMoney(msg, jackpot);
    clearGlobals();
  }
}

export const Lotto = {
  startLotto,
  claimLotto
};
