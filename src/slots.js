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
        key = `${msg.channel.guild.name}/${msg.channel.name}/${msg.author.username}`,
        slotsCountKey = `${key}/total`,
        slotsCountKeyData = getData(slotsCountKey) + 1;

    _.forEach(uniqueEmojiIds, (count, emoji_id) => {
        // dont count x1's in slots, no point
        if(count === 1) {
            return;
        }
        const currentDBIdentifer = `${key}/x${count}`,
            currentDBCount = getData(currentDBIdentifer);
        db.push(currentDBIdentifer, currentDBCount+1);
    });

    db.push(`${slotsCountKey}`, slotsCountKeyData);
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