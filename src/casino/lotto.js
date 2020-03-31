import { LOTTO, LOTTO_MAX, PLAYERS } from '@root/constants_internal';
import { getRandomElementFromList, getRandomNumberInRange } from '@casino/util';

import { Database } from '@root/database';
import { MoneyManager } from '@casino/moneymanager';
import _ from 'lodash';
import { sendMessageToChannel } from '@root/util';

let isWinner;
let winnerObject;
let winnerTimeout;
let jackpot;
let inLottoWaiting = false;

const getOnlineUsersList = (msg) => {
  const onlineUsers = msg.guild.members.cache
    .array()
    .filter((user) => user.presence.status !== 'offline' && user.user.bot === false);
  const onlineUsernameList = onlineUsers.map((user) => {
    return user.user.username;
  });
  return onlineUsernameList;
};

const sendStartingMessage = (msg, eligibleLottoUsers) => {
  let initialMessage = '';
  initialMessage += `Today's jackpot is **${jackpot.toLocaleString()}** Bitcoins! Wow!!!\n`;
  initialMessage += `The ticket holders are: **${eligibleLottoUsers.join(' ')}**\n`;
  initialMessage += `and the winner is........`;
  sendMessageToChannel(msg, initialMessage);
};

const missedClaim = (msg) => {
  sendMessageToChannel(msg, 'Nobody claimed the jackpot!!!! Better luck next time bros');
  clearGlobals();
};

const printWinner = (msg) => {
  const ONE_MINUTE = 60000;
  inLottoWaiting = false;
  sendMessageToChannel(msg, `${winnerObject} has won!!! Type !claim to claim your jackpot`);
  winnerTimeout = setTimeout(() => missedClaim(msg), ONE_MINUTE);
};

const isNewLottoPlayer = (msg, userLottoLottoKey) => {
  const userID = Database.getData(userLottoLottoKey);
  if (userID === msg.author.id) {
    return false;
  }
  return true;
};

const isEligibleLottoEvent = (msg) => {
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
      sendMessageToChannel(msg, `Hey bro, give someone else a chance!`);
    }
  } else {
    sendMessageToChannel(msg, `Sorry bro, !lotto is on cooldown. Try again later`);
  }
  return false;
};

const startLotto = (msg) => {
  if (!isEligibleLottoEvent(msg)) {
    return;
  }

  const FIVE_SECONDS = 5000;
  const serverData = Database.getData(`/${msg.channel.guild.name}/${PLAYERS}`);
  // maxBitcoinCount = _.first(_.orderBy(serverData, 'money', 'asc').reverse()).money,
  const onlineUsers = getOnlineUsersList(msg);
  const serverUsers = _.map(serverData, 'name');
  const eligibleLottoUsers = _.intersection(onlineUsers, serverUsers);
  const winner = getRandomElementFromList(eligibleLottoUsers);

  inLottoWaiting = true;
  winnerObject = _.head(
    msg.guild.members.cache.array().filter((user) => user.user.username === winner)
  );
  jackpot = getRandomNumberInRange(1, LOTTO_MAX);
  isWinner = true;

  sendStartingMessage(msg, eligibleLottoUsers);

  setTimeout(() => printWinner(msg), FIVE_SECONDS);
};

const clearGlobals = () => {
  clearTimeout(winnerTimeout);
  isWinner = false;
  winnerObject = null;
  jackpot = null;
  inLottoWaiting = false;
};

const claimLotto = (msg) => {
  if (isWinner && winnerObject.user.id === msg.author.id && !inLottoWaiting) {
    sendMessageToChannel(
      msg,
      `Congrats to ${
        msg.author.username
      }. You have been awarded **${jackpot.toLocaleString()}** Bitcoins. See you next time bros`
    );
    MoneyManager.addMoney(msg, jackpot);
    clearGlobals();
  }
};

export const Lotto = {
  startLotto,
  claimLotto
};
