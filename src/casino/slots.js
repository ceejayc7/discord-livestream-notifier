import { PLAYERS, SLOTS_MONEY } from '@root/constants';
import { messageError, sendMessageToChannel } from '@root/util';

import { Database } from '@root/database';
import { MoneyManager } from '@casino/moneymanager';
import _ from 'lodash';
import { getRandomElementFromList } from '@casino/util';

const generateRandomEmojiList = (emojiList) => {
  const randomList = [];
  const numberOfSlots = 5;

  for (let slot = 1; slot <= numberOfSlots; slot++) {
    randomList.push(getRandomElementFromList(emojiList));
  }
  return randomList;
};

const saveResults = (msg, randomList) => {
  const uniqueEmojiIds = _.countBy(randomList, 'id');
  const key = `/${msg.channel.guild.name}/${PLAYERS}/${msg.author.username}`;
  const slotsCountKeyTotal = `${key}/total`;
  const slotsCountKeyTotalData = Database.getData(slotsCountKeyTotal) + 1;

  // push name and increment total
  Database.writeData(`${key}/name`, msg.author.username);
  Database.writeData(`${slotsCountKeyTotal}`, slotsCountKeyTotalData);

  _.forEach(uniqueEmojiIds, (count) => {
    // dont count x1's in slots, no point
    if (count === 1) {
      return;
    } else if (count === 5) {
      const winnerEmoji = _.first(randomList);
      // prettier-ignore
      const messageToSend =
                `_ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ ${winnerEmoji} ${msg.author} HAS WON SLOTS!!!!!!!!!!!!!!!!!!! ${winnerEmoji}\n`+
                `           ${winnerEmoji}     ${msg.author} HAS WON SLOTS!!!!!!!!!!!!!!!!!!!     ${winnerEmoji}\n`+
                `       ${winnerEmoji}         ${msg.author} HAS WON SLOTS!!!!!!!!!!!!!!!!!!!         ${winnerEmoji}\n`+
                `   ${winnerEmoji}             ${msg.author} HAS WON SLOTS!!!!!!!!!!!!!!!!!!!             ${winnerEmoji}\n`+
                `${winnerEmoji}                ${msg.author} HAS WON SLOTS!!!!!!!!!!!!!!!!!!!                 ${winnerEmoji}\n`+
                `${winnerEmoji}                ${msg.author} HAS WON SLOTS!!!!!!!!!!!!!!!!!!!                 ${winnerEmoji}\n`+
                `   ${winnerEmoji}             ${msg.author} HAS WON SLOTS!!!!!!!!!!!!!!!!!!!             ${winnerEmoji}\n`+
                `       ${winnerEmoji}         ${msg.author} HAS WON SLOTS!!!!!!!!!!!!!!!!!!!         ${winnerEmoji}\n`+
                `           ${winnerEmoji}     ${msg.author} HAS WON SLOTS!!!!!!!!!!!!!!!!!!!     ${winnerEmoji}\n`+
                `               ${winnerEmoji} ${msg.author} HAS WON SLOTS!!!!!!!!!!!!!!!!!!! ${winnerEmoji}\n`;
      sendMessageToChannel(msg, messageToSend);
    }
    const currentDBIdentifer = `${key}/x${count}`;
    const currentDBCount = Database.getData(currentDBIdentifer);
    Database.writeData(currentDBIdentifer, currentDBCount + 1);
    MoneyManager.updateSlotsMoney(msg, count);
  });
};

const handleSlots = (msg) => {
  if (MoneyManager.isEnoughMoney(msg, SLOTS_MONEY.SLOTS_COST)) {
    MoneyManager.removeMoney(msg, SLOTS_MONEY.SLOTS_COST);
  } else {
    Database.initializeUser(msg.channel.guild.name, msg.author.username);
  }
  const emojiList = msg.guild.emojis.cache.map((emoji) => emoji);
  const randomList = generateRandomEmojiList(emojiList);

  if (_.first(randomList)) {
    sendMessageToChannel(msg, randomList.join(' '))
      .then(() => {
        saveResults(msg, randomList);
      })
      .catch(messageError);
  }
};

const leaderboard = (msg) => {
  const serverData = Database.getData(`/${msg.channel.guild.name}/${PLAYERS}`);
  const sorted = _.orderBy(serverData, ['x5', 'x4', 'x3', 'x2', 'total'], 'asc').reverse();
  let dataToDisplay = '';

  _.forEach(sorted, (player, index) => {
    if (player.total === 0) {
      return;
    }
    dataToDisplay += `${index + 1}. ${
      player.name
    } with a total of ${player.total.toLocaleString()} rolls `;
    if (player.x5 > 0) {
      dataToDisplay += `& ${player.x5.toLocaleString()} wins & ${player.x4.toLocaleString()} quad slots`;
    } else if (player.x4 > 0) {
      dataToDisplay += `& ${player.x4.toLocaleString()} quad slots & ${player.x3.toLocaleString()} triple slots`;
    } else if (player.x3 > 0) {
      dataToDisplay += `& ${player.x3.toLocaleString()} triple slots & ${player.x2.toLocaleString()} double slots`;
    } else if (player.x2 > 0) {
      dataToDisplay += `& ${player.x2.toLocaleString()} double slots`;
    }
    dataToDisplay += `\n`;
  });
  sendMessageToChannel(msg, '```perl\n' + dataToDisplay + '```');
};

export const Slots = {
  handleSlots,
  leaderboard
};
