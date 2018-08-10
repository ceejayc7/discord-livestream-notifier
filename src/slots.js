import _ from 'lodash';
import {Helpers} from './helpers.js';
import JsonDB from 'node-json-db';

const db = new JsonDB("slots_database", true, true);

function getRandomEmoji(emojiList) {
    return emojiList[Math.floor(Math.random()*emojiList.length)];
}

function generateRandomEmojiList(emojiList) {
    let randomList = [];
    const numberOfSlots = 5;

    for(let slot=1; slot <=numberOfSlots; slot++) {
        randomList.push(getRandomEmoji(emojiList));
    }
    return randomList;
}

function getSlotsData(key) {
    try {
        return db.getData(key);
    } catch(error) {
        return 0;
    }
}

function initializeResults(key) {
    // check to see if data exists before we initalize a new slots user
    if(getSlotsData(key)) {
        return;
    }

    // Init columns to default or 0
    db.push(`${key}/x2`, getSlotsData(`${key}/x2`));
    db.push(`${key}/x3`, getSlotsData(`${key}/x3`));
    db.push(`${key}/x4`, getSlotsData(`${key}/x4`));
    db.push(`${key}/x5`, getSlotsData(`${key}/x5`));
}

function saveResults(msg, randomList) {
    const uniqueEmojiIds = _.countBy(randomList, 'id'),
        key = `/${msg.channel.guild.name}/${msg.author.username}`,
        slotsCountKeyTotal = `${key}/total`,
        slotsCountKeyTotalData = getSlotsData(slotsCountKeyTotal) + 1;

    initializeResults(key);

    // push name and increment total
    db.push(`${key}/name`, msg.author.username);
    db.push(`${slotsCountKeyTotal}`, slotsCountKeyTotalData);

    _.forEach(uniqueEmojiIds, (count, emoji_id) => {
        // dont count x1's in slots, no point
        if(count === 1) {
            return;
        }
        else if(count === 5) {
            const winnerEmoji = _.first(randomList),
                messageToSend =
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
            Helpers.sendMessageToChannel(msg, messageToSend);
        }
        const currentDBIdentifer = `${key}/x${count}`,
            currentDBCount = getSlotsData(currentDBIdentifer);
        db.push(currentDBIdentifer, currentDBCount+1);
    });
}

function handleSlots(msg) {
    const emojiList = msg.guild.emojis.map((emoji) => (emoji)),
        randomList = generateRandomEmojiList(emojiList);

    if(_.first(randomList)) {
        Helpers.sendMessageToChannel(msg, randomList.join(' '))
            .then(() => {
                saveResults(msg, randomList);
            })
            .catch(Helpers.messageError);
    }
}

function leaderboard(msg) {
    const serverData = getSlotsData(`/${msg.channel.guild.name}`),
        sorted = _.orderBy(serverData, ['x5','x4','x3','x2', 'total'], 'asc').reverse();
    let dataToDisplay = '';

    _.forEach(sorted, (player, index) => {
        dataToDisplay += `${index+1}. ${player.name} with a total of ${player.total.toLocaleString()} rolls `;
        if(player.x5 > 0) {
            dataToDisplay += `& ${player.x5.toLocaleString()} wins & ${player.x4.toLocaleString()} quad slots`;
        }
        else if(player.x4 > 0) {
            dataToDisplay += `& ${player.x4.toLocaleString()} quad slots & ${player.x3.toLocaleString()} triple slots`;
        }
        else if(player.x3 > 0) {
            dataToDisplay += `& ${player.x3.toLocaleString()} triple slots & ${player.x2.toLocaleString()} double slots`;
        }
        else if(player.x2 > 0) {
            dataToDisplay += `& ${player.x2.toLocaleString()} double slots`;
        }
        dataToDisplay += `\n`;
    });
    Helpers.sendMessageToChannel(msg, "```perl\n"+dataToDisplay+"```")
}

export const Slots = {
    handleSlots,
    leaderboard
};
