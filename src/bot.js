import { isFishingServer, isWhitelistedChannel, messageError, printHelp } from '@root/util';

import { BOT_COMMANDS } from '@root/constants_internal';
import Blackjack from '@casino/blackjack';
import { CHANNEL_TO_SEND_LIVESTREAM_NOTIFICATIONS } from '@root/constants';
import Discord from 'discord.js';
import { Fish } from '@casino/fish';
import { Kpop } from '@root/kpop';
import { Lotto } from '@casino/lotto';
import { MoneyManager } from '@casino/moneymanager';
import { Slots } from '@casino/slots';
import _ from 'lodash';
import { sendTweet } from '@root/twitter';

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
      if (!isWhitelistedChannel(msg)) {
        return;
      }

      // parameter commands
      if (_.startsWith(msg.content, BOT_COMMANDS.BLACKJACK.command)) {
        !this.blackjack.isGameStarted ? this.blackjack.initGame(msg) : false;
        return;
      } else if (_.startsWith(msg.content, BOT_COMMANDS.GENERATE.command)) {
        Kpop.parseIPTVCommand(msg);
      } else if (_.startsWith(msg.content, BOT_COMMANDS.TWEET.command)) {
        if (isFishingServer(msg)) {
          sendTweet(msg);
        }
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
          printHelp(msg);
          break;
        case BOT_COMMANDS.LEADERBOARD_SHORTHAND.command:
        case BOT_COMMANDS.LEADERBOARD.command:
          MoneyManager.printLeaderboard(msg);
          break;
        case BOT_COMMANDS.FISH.command:
          if (isFishingServer(msg)) {
            Fish.printFishLine(msg);
          }
          break;
        case BOT_COMMANDS.FISH_LEADERBOARD.command:
          if (isFishingServer(msg)) {
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
          Kpop.onKpopCommand(msg);
          break;
      }
    });
  };

  sendEmbed = (streamMessage, embed = '') => {
    this.client.channels.cache
      .find((channel) => channel.name === CHANNEL_TO_SEND_LIVESTREAM_NOTIFICATIONS)
      .send(streamMessage, embed)
      .catch(messageError);
  };

  sendLiveMessage = (streamData) => {
    const { streamMessage, embed } = streamData;
    if (this.isLoggedIn) {
      this.sendEmbed(streamMessage, embed);
    }
  };
}

export default Bot;
