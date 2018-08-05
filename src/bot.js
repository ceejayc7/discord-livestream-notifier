import Discord from 'discord.js';
import _ from 'lodash';
import Blackjack from './blackjack.js';
import {Slots} from './slots.js';
import {Helpers} from './helpers.js';
import {LOCALHOST_VIEWER, CHANNEL_TO_SEND_LIVESTREAM_NOTIFICATIONS} from './constants.js';

class Bot {
    constructor(loginToken) {
        this.client = new Discord.Client();
        this.isLoggedIn = false;
        this.loginToken = loginToken;
        this.blackjack = new Blackjack();
    }

    initializeDiscordClient = () => {
        this.client = new Discord.Client();
        this.client.attachListeners();
        this.client.loginToDiscord();
    };

    loginToDiscord = () => {
        this.client.login(this.loginToken);
    };

    logoutOfDiscord = () => {
        console.log("Destroying discord client");
        this.isLoggedIn = false;
        return this.client.destroy();
    };

    attachListeners = () => {
        this.client.on('ready', () => {
            console.log(`Logged in as ${this.client.user.tag}!`);
            this.isLoggedIn = true;
        });

        this.client.on('error', (error) => {
            console.log(`An error occured with the discord client. ${error.message}!`);
        });

        this.client.on('message', (msg) => {
            const SLOTS = '!slots',
                SLOTS_LB = '!slotslb',
                BLACKJACK = '!21',
                BLACKJACK_HIT = '!hit',
                BLACKJACK_STAND = '!stand';

            if(Helpers.isBlacklistedChannel(msg)) {
                return;
            }

            switch(msg.content) {
                case SLOTS:
                    Slots.handleSlots(msg);
                    break;
                case SLOTS_LB:
                    Slots.leaderboard(msg);
                    break;
                case BLACKJACK:
                    !this.blackjack.isGameStarted ? this.blackjack.initGame(msg) : false;
                    break;
                case BLACKJACK_HIT:
                    this.blackjack.isGameStarted ? this.blackjack.hit(msg) : false;
                    break;
                case BLACKJACK_STAND:
                    this.blackjack.isGameStarted ? this.blackjack.stand(msg) : false;
                    break;
            }
        });

    }

    sendLiveMessage = (stream) => {
        if(this.isLoggedIn) {
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
                            .addField("Viewers", viewers, true)
                            .setTimestamp(`${created_at}`);

                    // game is an optional string and we cant pass in an empty field into an embed
                    if(game) {
                        embed.addField("Game", game, true);
                    }

                    this.client.channels.find('name', CHANNEL_TO_SEND_LIVESTREAM_NOTIFICATIONS).send(streamMessage, embed)
                        .catch(Helpers.messageError);
                    break;

                case "localhost":
                    const messageToSend = `${stream.name} is now live - ${LOCALHOST_VIEWER}`;

                    this.client.channels.find('name', CHANNEL_TO_SEND_LIVESTREAM_NOTIFICATIONS).send(messageToSend)
                        .catch(Helpers.messageError);
                    break;

                case "mixer":
                    const beamStreamUrl = _.get(stream,'url'),
                        beamImage = _.get(stream, 'preview'),
                        beamName = _.get(stream, 'name'),
                        beamLogo = _.get(stream, 'logo'),
                        beamSiteLogo = "https://puu.sh/B8Ude/262ffd918e.png",
                        beamTitle = _.get(stream, 'title'),
                        beamGame = _.get(stream, 'game'),
                        beamUpdatedAt = _.get(stream, 'updated_at'),
                        beamViewers = _.get(stream, 'viewers').toLocaleString(),
                        beamStreamMessage = `${beamName} is now live at ${beamStreamUrl}`,
                        beamColor = 6570404,
                        beamEmbed = new Discord.RichEmbed()
                            .setAuthor(beamName, beamSiteLogo, beamStreamUrl)
                            .setColor(beamColor)
                            .setImage(beamImage)
                            .setTitle(beamTitle)
                            .setURL(beamStreamUrl)
                            .setThumbnail(beamLogo)
                            .addField("Viewers", beamViewers, true)
                            .setTimestamp(`${beamUpdatedAt}`);

                    // game is an optional string and we cant pass in an empty field into an embed
                    if(beamGame) {
                        beamEmbed.addField("Game", beamGame, true);
                    }

                    this.client.channels.find('name', CHANNEL_TO_SEND_LIVESTREAM_NOTIFICATIONS).send(beamStreamMessage, beamEmbed)
                        .catch(Helpers.messageError);
                    break;
            }
        }
    }
}

export default Bot;