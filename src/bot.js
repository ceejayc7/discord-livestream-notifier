import {
  isCasinoChannel,
  isFishingServer,
  isKpopChannel,
  isTweetingServer,
  messageError,
  printHelp
} from '@root/util';

import { BOT_COMMANDS } from '@root/constants';
import Blackjack from '@casino/blackjack';
import Discord from 'discord.js';
import { Fish } from '@casino/fish';
import { Kpop } from '@root/kpop';
import { Lotto } from '@casino/lotto';
import { MoneyManager } from '@casino/moneymanager';
import { Slots } from '@casino/slots';
import _ from 'lodash';
import { sendTweet } from '@root/twitter';

const CONSTANTS = require('@data/constants.json').serverConfig;

class Bot {
  constructor(loginToken, serverName) {
    this.client = new Discord.Client();
    this.isLoggedIn = false;
    this.loginToken = loginToken;
    this.blackjack = new Blackjack();
    this.serverName = serverName;
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
      // parameter commands
      if (_.startsWith(msg.content, BOT_COMMANDS.BLACKJACK.command)) {
        isCasinoChannel(msg) && !this.blackjack.isGameStarted && this.blackjack.initGame(msg);
        return;
      } else if (_.startsWith(msg.content, BOT_COMMANDS.GENERATE.command)) {
        isKpopChannel(msg) && Kpop.parseIPTVCommand(msg);
        return;
      } else if (_.startsWith(msg.content, BOT_COMMANDS.TWEET.command)) {
        isTweetingServer(msg) && sendTweet(msg);
        return;
      }

      // non-parameter commands
      switch (msg.content) {
        case BOT_COMMANDS.SLOTS.command:
          isCasinoChannel(msg) && Slots.handleSlots(msg);
          break;
        case BOT_COMMANDS.SLOTS_LB.command:
          isCasinoChannel(msg) && Slots.leaderboard(msg);
          break;
        case BOT_COMMANDS.BLACKJACK_HIT_SHORTHAND.command:
        case BOT_COMMANDS.BLACKJACK_HIT.command:
          isCasinoChannel(msg) && this.blackjack.isGameStarted && this.blackjack.hit(msg);
          break;
        case BOT_COMMANDS.BLACKJACK_STAND_SHORTHAND.command:
        case BOT_COMMANDS.BLACKJACK_STAND.command:
          isCasinoChannel(msg) && this.blackjack.isGameStarted && this.blackjack.stand(msg);
          break;
        case BOT_COMMANDS.BLACKJACK_DOUBLE_SHORTHAND.command:
        case BOT_COMMANDS.BLACKJACK_DOUBLE.command:
          isCasinoChannel(msg) && this.blackjack.isGameStarted && this.blackjack.double(msg);
          break;
        case BOT_COMMANDS.BLACKJACK_SPLIT.command:
          isCasinoChannel(msg) && this.blackjack.isGameStarted && this.blackjack.split(msg);
          break;
        case BOT_COMMANDS.BITCOIN_SHORTHAND.command:
        case BOT_COMMANDS.BITCOIN.command:
          isCasinoChannel(msg) && MoneyManager.printMoney(msg);
          break;
        case BOT_COMMANDS.LEADERBOARD_SHORTHAND.command:
        case BOT_COMMANDS.LEADERBOARD.command:
          isCasinoChannel(msg) && MoneyManager.printLeaderboard(msg);
          break;
        case BOT_COMMANDS.LOTTO.command:
          isCasinoChannel(msg) && Lotto.startLotto(msg);
          break;
        case BOT_COMMANDS.LOTTO_CLAIM.command:
          isCasinoChannel(msg) && Lotto.claimLotto(msg);
          break;
        case BOT_COMMANDS.FISH.command:
          isFishingServer(msg) && Fish.printFishLine(msg);
          break;
        case BOT_COMMANDS.FISH_LEADERBOARD.command:
          isFishingServer(msg) && Fish.printLeaderboard(msg);
        case BOT_COMMANDS.KPOP.command:
          isKpopChannel(msg) && Kpop.onKpopCommand(msg);
          break;
        case BOT_COMMANDS.HELP.command:
          printHelp(msg);
          break;
      }
    });
  };

  sendEmbed = (streamMessage, embed = '') => {
    const channelsToSendTo = CONSTANTS?.[this.serverName]?.streamChannels;

    for (const channelToSendTo of channelsToSendTo) {
      this.client.channels.cache
        .find((channel) => channel.name === channelToSendTo)
        .send(streamMessage, embed)
        .catch(messageError);
    }
  };

  sendLiveMessage = (streamData) => {
    const { streamMessage, embed } = streamData;
    if (this.isLoggedIn) {
      this.sendEmbed(streamMessage, embed);
    }
  };
}

export default Bot;
