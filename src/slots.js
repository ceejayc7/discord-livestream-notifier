import _ from 'lodash';
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

function isBlacklistedChannel(msg) {
    if(msg && msg.channel.name === "general" && msg.channel.guild.name === "silkroad") {
        return true;
    }
    return false;
}

function getData(key) {
    try {
        return db.getData(key);
    } catch(error) {
        return 0;
    }
}

function saveResults(msg, randomList) {
    const uniqueEmojiIds = _.countBy(randomList, 'id'),
        key = `/${msg.channel.guild.name}/${msg.author.username}`,
        slotsCountKeyTotal = `${key}/total`,
        slotsCountKeyTotalData = getData(slotsCountKeyTotal) + 1;

    _.forEach(uniqueEmojiIds, (count, emoji_id) => {
        // dont count x1's in slots, no point
        if(count === 1) {
            return;
        }
        const currentDBIdentifer = `${key}/x${count}`,
            currentDBCount = getData(currentDBIdentifer);
        db.push(currentDBIdentifer, currentDBCount+1);
    });

    // Init columns to default or 0
    db.push(`${key}/x2`, getData(`${key}/x2`));
    db.push(`${key}/x3`, getData(`${key}/x3`));
    db.push(`${key}/x4`, getData(`${key}/x4`));
    db.push(`${key}/x5`, getData(`${key}/x5`));

    db.push(`${key}/name`, msg.author.username);
    db.push(`${slotsCountKeyTotal}`, slotsCountKeyTotalData);
}

function handleSlots(msg) {
    if (isBlacklistedChannel(msg)) {
        return;
    }
    const emojiList = msg.guild.emojis.map((emoji) => (emoji)),
        randomList = generateRandomEmojiList(emojiList);

    if(_.first(randomList)) {
        msg.channel.send(randomList.join(' '))
            .then( () => {
                saveResults(msg, randomList);
            })
            .catch((error) => {
                console.log(`Unable to send message. ${error}`);
            });
    }
    else {
        msg.channel.send("Server has no custom emoji's for slots!");
    }
}

function leaderboard(msg) {
    const serverData = getData(`/${msg.channel.guild.name}`),
        sorted = _.orderBy(serverData, ['x2','x3','x4','x5'], 'desc');
    let dataToDisplay = '';

    _.forEach(sorted, (player, index) => {
        dataToDisplay += `${index+1}. ${player.name} with a total of ${player.total} rolls `;
        if(player.x5 > 0) {
            dataToDisplay += `& ${player.x5} wins`;
        }
        else if(player.x4 > 0) {
            dataToDisplay += `& ${player.x4} quad slots`;
        }
        else if(player.x3 > 0) {
            dataToDisplay += `& ${player.x3} triple slots`;
        }
        else if(player.x2 > 0) {
            dataToDisplay += `& ${player.x2} double slots`;
        }
        dataToDisplay += `\n`;
    });
    msg.channel.send("```perl\n"+dataToDisplay+"```");
}

export const Slots = {
    handleSlots: handleSlots,
    isBlacklistedChannel: isBlacklistedChannel,
    generateRandomEmojiList: generateRandomEmojiList,
    getRandomEmoji: getRandomEmoji,
    leaderboard: leaderboard
};



/*
function isSlotsSpam() {
    const currentTime = (new Date).getTime(),
        spamTimer = 2000;

    if(lastSlotsSentTime && (currentTime - lastSlotsSentTime) < spamTimer) {
        return true;
    }
    lastSlotsSentTime = currentTime;
    return false;
} */