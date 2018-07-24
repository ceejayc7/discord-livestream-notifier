import Discord from 'discord.js';
import _ from 'lodash';

class Bot {
    constructor(loginToken) {
        this.client = new Discord.Client();
        this.isLoggedIn = false;
        this.loginToken = loginToken;
        this.lastSlotsSentTime = null;
    }

    loginToDiscord = () => {
        this.client.login(this.loginToken);
    };

    logoutOfDiscord = () => {
        console.log("Destroying discord client");
        return this.client.destroy();
    };

    getRandomEmoji = (emojiList) => {
        return emojiList[Math.floor(Math.random()*emojiList.length)];
    }

    attachListeners = () => {
        this.client.on('ready', () => {
            console.log(`Logged in as ${this.client.user.tag}!`);
            this.isLoggedIn = true;
        });

        this.client.on('error', (error) => {
            console.log(`An error occured with the discord client. ${error}!`);
            this.isLoggedIn = false;
            this.logoutOfDiscord()
                .then(loginToDiscord)
                .catch((error) => {
                    console.log(`Unable to re-login back to discord. ${error}`);
                });
        });

        this.client.on('message', (msg) => {
            const SLOTS = '!slots',
                currentTime = (new Date).getTime(),
                spamTimer = 2500;

            if(_.startsWith(msg.content, SLOTS)) {
                // reduce slots spam
                if(this.lastSlotsSentTime && (currentTime - this.lastSlotsSentTime) < spamTimer) {
                    return;
                }

                const emojiList = msg.guild.emojis.map((emoji) => (emoji)),
                    randomList = [],
                    numberOfSlots = 5;

                for(let slot=1; slot <=numberOfSlots; slot++) {
                    randomList.push(this.getRandomEmoji(emojiList));
                }
                msg.channel.send(randomList.join(' '));

                this.lastSlotsSentTime = currentTime;
            }
        });

    }

    sendLiveMessage = (stream) => {
        if(this.isLoggedIn) {
            // TO DO: Hardcoded to general channel
            switch(stream.platform) {
                case "twitch":
                    const discordChannelToSendMessage = "general",
                        streamUrl = _.get(stream,'url'),
                        image = _.get(stream, 'preview'),
                        streamDisplayName = _.get(stream, 'displayName'),
                        logo = _.get(stream, 'logo'),
                        twitchLogo = "https://cdn.discordapp.com/emojis/287637883022737418",
                        title = _.get(stream, 'title'),
                        game = _.get(stream, 'game'),
                        created_at = _.get(stream, 'created_at'),
                        viewers = _.get(stream, 'viewers').toLocaleString(),
                        streamMessage = `${streamDisplayName} is now live at ${streamUrl}`,
                        color = 6570404,
                        embed = new Discord.RichEmbed()
                            .setAuthor(streamDisplayName, twitchLogo, streamUrl)
                            .setColor(color)
                            .setImage(image)
                            .setTitle(title)
                            .setURL(streamUrl)
                            .setThumbnail(logo)
                            .addField("Game", game, true)
                            .addField("Viewers", viewers, true)
                            .setTimestamp(`${created_at}`);

                    this.client.channels.find('name',discordChannelToSendMessage).send(streamMessage, embed)
                        .catch((error) => {
                            console.log(`Unable to send message. ${error}`);
                        });
            }
        }
    }
}

export default Bot;