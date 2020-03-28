import { onKpopCommand, parseIPTVCommand } from '@root/kpop';

import { BOT_COMMANDS } from '@root/constants_internal';
import Blackjack from '@root/blackjack';
import { CHANNEL_TO_SEND_LIVESTREAM_NOTIFICATIONS } from '@root/constants';
import Discord from 'discord.js';
import { Fish } from '@root/fish';
import { Helpers } from '@root/helpers';
import { Lotto } from '@root/lotto';
import { MoneyManager } from '@root/moneymanager';
import { Slots } from '@root/slots';
import _ from 'lodash';

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
    console.log('Destroying discord client');
    this.isLoggedIn = false;
    return this.client.destroy();
  };

  attachListeners = () => {
    this.client.on('ready', () => {
      console.log(`Logged in as ${this.client.user.tag}!`);
      this.isLoggedIn = true;
    });

    this.client.on('error', (error) => {
      console.log(
        `An error occured with the discord client. \t Error name: ${error.name} \t Error message: ${error.message}`
      );
    });

    this.client.on('message', (msg) => {
      if (!Helpers.isWhitelistedChannel(msg)) {
        return;
      }

      // parameter commands
      if (_.startsWith(msg.content, BOT_COMMANDS.BLACKJACK.command)) {
        !this.blackjack.isGameStarted ? this.blackjack.initGame(msg) : false;
        return;
      } else if (_.startsWith(msg.content, BOT_COMMANDS.GENERATE.command)) {
        parseIPTVCommand(msg);
      }

      // non-parameter commands
      switch (msg.content) {
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
          if (Helpers.isFishingServer(msg)) {
            Fish.printFishLine(msg);
          }
          break;
        case BOT_COMMANDS.FISH_LEADERBOARD.command:
          if (Helpers.isFishingServer(msg)) {
            Fish.printLeaderboard(msg);
          }
          break;
        case BOT_COMMANDS.LOTTO.command:
          Lotto.startLotto(msg);
          break;
        case BOT_COMMANDS.LOTTO_CLAIM.command:
          Lotto.claimLotto(msg);
          break;
        case BOT_COMMANDS.KPOP.command:
          onKpopCommand(msg);
          break;
      }
    });
  };

  sendEmbed = (streamMessage, embed = '') => {
    this.client.channels.cache
      .find((channel) => channel.name === CHANNEL_TO_SEND_LIVESTREAM_NOTIFICATIONS)
      .send(streamMessage, embed)
      .catch(Helpers.messageError);
  };

  sendLiveMessage = (stream) => {
    if (this.isLoggedIn) {
      switch (stream.platform) {
        case 'twitch':
          const streamUrl = _.get(stream, 'url');
          const image = _.get(stream, 'preview');
          const streamDisplayName = _.get(stream, 'displayName');
          const logo = _.get(stream, 'logo');
          const twitchLogo = 'https://cdn.discordapp.com/emojis/287637883022737418';
          const title = _.get(stream, 'title');
          const game = _.get(stream, 'game');
          const createdAt = _.get(stream, 'created_at');
          const viewers = _.get(stream, 'viewers').toLocaleString();
          const streamMessage = `${streamDisplayName} is now live at ${streamUrl}`;
          const color = 6570404;
          const embed = new Discord.MessageEmbed()
            .setAuthor(streamDisplayName, twitchLogo, streamUrl)
            .setColor(color)
            .setImage(image)
            .setTitle(title)
            .setURL(streamUrl)
            .setThumbnail(logo)
            .setTimestamp(`${createdAt}`);

          // game is an optional string and we cant pass in an empty field into an embed
          if (game) {
            embed.addField('Game', game, true);
          }

          embed.addField('Viewers', viewers, true);
          this.sendEmbed(streamMessage, embed);
          break;

        case 'mixer':
          const beamStreamUrl = _.get(stream, 'url');
          const beamImage = _.get(stream, 'preview');
          const beamName = _.get(stream, 'name');
          const beamLogo = _.get(stream, 'logo');
          const beamSiteLogo = 'https://puu.sh/B8Ude/262ffd918e.png';
          const beamTitle = _.get(stream, 'title');
          const beamGame = _.get(stream, 'game');
          const beamUpdatedAt = _.get(stream, 'updated_at');
          const beamViewers = _.get(stream, 'viewers').toLocaleString();
          const beamStreamMessage = `${beamName} is now live at ${beamStreamUrl}`;
          const beamColor = 2079469;
          const beamEmbed = new Discord.MessageEmbed()
            .setAuthor(beamName, beamSiteLogo, beamStreamUrl)
            .setColor(beamColor)
            .setImage(beamImage)
            .setTitle(beamTitle)
            .setURL(beamStreamUrl)
            .setThumbnail(beamLogo)
            .setTimestamp(`${beamUpdatedAt}`);

          // game is an optional string and we cant pass in an empty field into an embed
          if (beamGame) {
            beamEmbed.addField('Game', beamGame, true);
          }

          beamEmbed.addField('Viewers', beamViewers, true);
          this.sendEmbed(beamStreamMessage, beamEmbed);
          break;

        case 'youtube':
          const youtubeStreamUrl = _.get(stream, 'url');
          const youtubeImage = _.get(stream, 'preview');
          const youtubeName = _.get(stream, 'channelTitle');
          const youtubeSiteLogo = 'https://puu.sh/Bucut/9645bccf23.png';
          const youtubeTitle = _.get(stream, 'title');
          const youtubeUpdatedAt = _.get(stream, 'updated_at');
          const youtubeStreamMessage = `${youtubeName} is now live at ${youtubeStreamUrl}`;
          const youtubeColor = 16711680;
          const youtubeEmbed = new Discord.MessageEmbed()
            .setAuthor(youtubeName, youtubeSiteLogo, youtubeStreamUrl)
            .setColor(youtubeColor)
            .setImage(youtubeImage)
            .setTitle(youtubeTitle)
            .setURL(youtubeStreamUrl)
            .setTimestamp(`${youtubeUpdatedAt}`);

          this.sendEmbed(youtubeStreamMessage, youtubeEmbed);
          break;

        case 'okru':
          const okruStreamUrl = _.get(stream, 'url');
          const okruImage = _.get(stream, 'preview');
          const okruName = _.get(stream, 'displayName');
          const okruSiteLogo = 'http://puu.sh/Bz2nm/aacfb2c3d6.png';
          const okruTitle = _.get(stream, 'title');
          const okruLogo = _.get(stream, 'logo');
          const okruStreamMessage = `${okruName} is now live at ${okruStreamUrl}`;
          const okruColor = 16089632;
          const okruTimestamp = _.get(stream, 'updated_at');
          const okruEmbed = new Discord.MessageEmbed()
            .setAuthor(okruName, okruSiteLogo, okruStreamUrl)
            .setColor(okruColor)
            .setImage(okruImage)
            .setTitle(okruTitle)
            .setThumbnail(okruLogo)
            .setURL(okruStreamUrl)
            .setTimestamp(okruTimestamp);

          this.sendEmbed(okruStreamMessage, okruEmbed);
          break;

        case 'vlive':
          const vliveStreamUrl = _.get(stream, 'url');
          const vliveImage = _.get(stream, 'preview');
          const vliveName = _.get(stream, 'displayName');
          const vliveSiteLogo = 'https://i.imgur.com/AaJHKAB.png';
          const vliveTitle = _.get(stream, 'title');
          const vliveLogo = _.get(stream, 'logo');
          const vliveStreamMessage = `${vliveName} is now live at ${vliveStreamUrl}`;
          const vliveColor = 5568511;
          const vliveTimestamp = _.get(stream, 'updated_at');
          const vliveEmbed = new Discord.MessageEmbed()
            .setAuthor(vliveName, vliveSiteLogo, vliveStreamUrl)
            .setColor(vliveColor)
            .setImage(vliveImage)
            .setTitle(vliveTitle)
            .setThumbnail(vliveLogo)
            .setURL(vliveStreamUrl)
            .setTimestamp(vliveTimestamp);

          this.sendEmbed(vliveStreamMessage, vliveEmbed);
          break;
      }
    }
  };
}

export default Bot;
