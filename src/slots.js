import _ from 'lodash';
//import JsonDB from 'node-json-db';

//const db = new JsonDB("dist/slots", true, true);

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

function handleSlots(msg) {
    if (isBlacklistedChannel(msg)) {
        return;
    }
    const emojiList = msg.guild.emojis.map((emoji) => (emoji)),
        randomList = generateRandomEmojiList(emojiList);

    if(_.first(randomList)) {
        //const dbKey = `${msg.channel.guild.name}/${msg.channel.name}/${msg.author.username}`;
        //db.push(dbKey, 1);
        msg.channel.send(randomList.join(' '));
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