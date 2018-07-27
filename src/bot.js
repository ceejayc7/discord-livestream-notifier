import Discord from 'discord.js';
import _ from 'lodash';
import {Slots} from './slots.js';
import {LOCALHOST_VIEWER, CHANNEL_TO_SEND_LIVESTREAM_NOTIFICATIONS} from './constants.js';

class Bot {
    constructor(loginToken) {
        this.client = new Discord.Client();
        this.isLoggedIn = false;
        this.loginToken = loginToken;
    }

    loginToDiscord = () => {
        this.client.login(this.loginToken);
    };

    logoutOfDiscord = () => {
        console.log("Destroying discord client");
        return this.client.destroy();
    };

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
                SLOTS_LB = '!slotslb';

            switch(msg.content) {
                case SLOTS:
                    Slots.handleSlots(msg);
                    break;
                case SLOTS_LB:
                    Slots.leaderboard(msg);
                    break;
            }
        });

    }

    livestreamError = (error) => {
        console.log(`Unable to send message. ${error}`);
    }

    sendLiveMessage = (stream) => {
        if(this.isLoggedIn) {
            // TO DO: Hardcoded to general channel
            switch(stream.platform) {
                case "twitch":
                    const streamUrl = _.get(stream,'url'),
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

                    this.client.channels.find('name', CHANNEL_TO_SEND_LIVESTREAM_NOTIFICATIONS).send(streamMessage, embed)
                        .catch(this.livestreamError);
                    break;

                case "localhost":
                    const messageToSend = `${stream.name} is now live - ${LOCALHOST_VIEWER}`;

                    this.client.channels.find('name', CHANNEL_TO_SEND_LIVESTREAM_NOTIFICATIONS).send(messageToSend)
                        .catch(this.livestreamError);
                    break;
            }
        }
    }
}

export default Bot;