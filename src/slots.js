import _ from 'lodash';

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

function isSlotsSpam() {
    const currentTime = (new Date).getTime(),
        spamTimer = 2000;

    if(lastSlotsSentTime && (currentTime - lastSlotsSentTime) < spamTimer) {
        return true;
    }
    lastSlotsSentTime = currentTime;
    return false;
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

    if(_.get(randomList, 0)) {
        msg.channel.send(randomList.join(' '));
    }
    else {
        msg.channel.send("Server has no custom emoji's for slots!");
    }
}


export const Slots = {
    handleSlots: handleSlots,
    isBlacklistedChannel: isBlacklistedChannel,
    isSlotsSpam: isSlotsSpam,
    generateRandomEmojiList: generateRandomEmojiList,
    getRandomEmoji: getRandomEmoji
};