import Discord from 'discord.js';
import _ from 'lodash';
import Blackjack from './blackjack.js';
import { Slots } from './slots.js';
import { Helpers } from './helpers.js';
import { LOCALHOST_VIEWER, CHANNEL_TO_SEND_LIVESTREAM_NOTIFICATIONS } from './constants.js';
import { BOT_COMMANDS } from './constants_internal.js';
import { MoneyManager } from './moneymanager.js';
import { Fish } from './fish.js';
import { Lotto } from './lotto.js';

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
            if(!Helpers.isWhitelistedChannel(msg)) {
                return;
            }

            //parameter commands
            if(_.startsWith(msg.content, BOT_COMMANDS.BLACKJACK.command)) {
                !this.blackjack.isGameStarted ? this.blackjack.initGame(msg) : false;
                return;
            }

            // non-parameter commands
            switch(msg.content) {
                case BOT_COMMANDS.SLOTS.command:
                    Slots.handleSlots(msg);
                    break;
                case BOT_COMMANDS.SLOTS_LB.command:
                    Slots.leaderboard(msg);
                    break;
                case BOT_COMMANDS.BLACKJACK_HIT_SHORTHAND.command:
                case BOT_COMMANDS.BLACKJACK_HIT.command:
                    this.blackjack.isGameStarted ? this.blackjack.hit(msg) : false;
                    break;
                case BOT_COMMANDS.BLACKJACK_STAND_SHORTHAND.command:
                case BOT_COMMANDS.BLACKJACK_STAND.command:
                    this.blackjack.isGameStarted ? this.blackjack.stand(msg) : false;
                    break;
                case BOT_COMMANDS.BLACKJACK_DOUBLE_SHORTHAND.command:
                case BOT_COMMANDS.BLACKJACK_DOUBLE.command:
                    this.blackjack.isGameStarted ? this.blackjack.double(msg) : false;
                    break;
                case BOT_COMMANDS.BLACKJACK_SPLIT.command:
                    this.blackjack.isGameStarted ? this.blackjack.split(msg) : false;
                    break;
                case BOT_COMMANDS.BITCOIN_SHORTHAND.command:
                case BOT_COMMANDS.BITCOIN.command:
                    MoneyManager.printMoney(msg);
                    break;
                case BOT_COMMANDS.HELP.command:
                    Helpers.printHelp(msg);
                    break;
                case BOT_COMMANDS.LEADERBOARD_SHORTHAND.command:
                case BOT_COMMANDS.LEADERBOARD.command:
                    MoneyManager.printLeaderboard(msg);
                    break;
                case BOT_COMMANDS.FISH.command:
                    if(Helpers.isFishingServer(msg)) {
                        Fish.printFishLine(msg);
                    }
                    break;
                case BOT_COMMANDS.FISH_LEADERBOARD.command:
                    if(Helpers.isFishingServer(msg)) {
                        Fish.printLeaderboard(msg);
                    }
                    break;
                case BOT_COMMANDS.LOTTO.command:
                    Lotto.startLotto(msg);
                    break;
                case BOT_COMMANDS.LOTTO_CLAIM.command:
                    Lotto.claimLotto(msg);
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
                            .setTimestamp(`${created_at}`);

                    // game is an optional string and we cant pass in an empty field into an embed
                    if(game) {
                        embed.addField("Game", game, true);
                    }

                    embed.addField("Viewers", viewers, true);

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
                        beamColor = 2079469,
                        beamEmbed = new Discord.RichEmbed()
                            .setAuthor(beamName, beamSiteLogo, beamStreamUrl)
                            .setColor(beamColor)
                            .setImage(beamImage)
                            .setTitle(beamTitle)
                            .setURL(beamStreamUrl)
                            .setThumbnail(beamLogo)
                            .setTimestamp(`${beamUpdatedAt}`);

                    // game is an optional string and we cant pass in an empty field into an embed
                    if(beamGame) {
                        beamEmbed.addField("Game", beamGame, true);
                    }

                    beamEmbed.addField("Viewers", beamViewers, true);

                    this.client.channels.find('name', CHANNEL_TO_SEND_LIVESTREAM_NOTIFICATIONS).send(beamStreamMessage, beamEmbed)
                        .catch(Helpers.messageError);
                    break;

                    case "youtube":
                        const youtubeStreamUrl = _.get(stream,'url'),
                            youtubeImage = _.get(stream, 'preview'),
                            youtubeName = _.get(stream, 'channelTitle'),
                            youtubeSiteLogo = "https://puu.sh/Bucut/9645bccf23.png",
                            youtubeTitle = _.get(stream, 'title'),
                            youtubeUpdatedAt = _.get(stream, 'updated_at'),
                            youtubeStreamMessage = `${youtubeName} is now live at ${youtubeStreamUrl}`,
                            youtubeColor = 16711680,
                            youtubeEmbed = new Discord.RichEmbed()
                                .setAuthor(youtubeName, youtubeSiteLogo, youtubeStreamUrl)
                                .setColor(youtubeColor)
                                .setImage(youtubeImage)
                                .setTitle(youtubeTitle)
                                .setURL(youtubeStreamUrl)
                                .setTimestamp(`${youtubeUpdatedAt}`);

                            this.client.channels.find('name', CHANNEL_TO_SEND_LIVESTREAM_NOTIFICATIONS).send(youtubeStreamMessage, youtubeEmbed)
                                .catch(Helpers.messageError);
                            break;
            }
        }
    }
}

export default Bot;