import { client as TwitterClient, retweet, sendReply, sendTweet } from '@root/twitter';
import { doesMsgContainInstagram, sendInstagramEmbeds } from '@root/instagram';
import {
  isCasinoChannel,
  isFishingServer,
  isKpopChannel,
  isTweetingServer,
  messageError,
  sendMessageToChannel
} from '@root/util';

import { BOT_COMMANDS } from '@root/constants';
import Blackjack from '@casino/blackjack';
import Discord from 'discord.js';
import { Fish } from '@casino/fish';
import { Kpop } from '@root/kpop';
import { Lotto } from '@casino/lotto';
import { MoneyManager } from '@casino/moneymanager';
import { Slots } from '@casino/slots';
import TriviaManager from '@casino/trivia/triviamanager';
import _ from 'lodash';
import { exec } from 'child_process';
import { getCryptocurrencyPrice } from '@root/crypto';

// import { sendCosplayTweet } from '@root/cosplay';

const CONSTANTS = require('@data/constants.json').serverConfig;
const OVERRIDES = require('@data/constants.json').overrides;

class Bot {
  constructor(serverConfig, serverName) {
    this.client = new Discord.Client();
    this.isLoggedIn = false;
    this.discordToken = serverConfig.discordToken;
    this.serverConfig = serverConfig;
    this.blackjack = new Blackjack();
    this.serverName = serverName;
    this.triviaManager = new TriviaManager();
    this.twitterStream = null;
  }

  handleTwitterStream = () => {
    if (
      this.serverConfig?.dumpTweets &&
      this.serverConfig.dumpTweets?.channel &&
      this.serverConfig.dumpTweets?.twitterId
    ) {
      this.twitterStream = TwitterClient.stream('statuses/filter', {
        follow: this.serverConfig.dumpTweets.twitterId
      });

      this.twitterStream.on('data', (event) => {
        // eslint-disable-next-line
        if (event?.retweeted_status !== undefined) {
          return;
        }

        console.log(
          `Twitter stream: received tweet from ${this.serverConfig.dumpTweets.twitterId}`
        );
        this.client.channels.cache
          .find(
            (channel) =>
              channel.name === this.serverConfig.dumpTweets.channel && channel.type === 'text'
          )
          .send(`https://twitter.com/${event?.user?.screen_name}/status/${event?.id_str}`); // eslint-disable-line
      });

      this.twitterStream.on('error', (error) => {
        console.log('Twitter stream: error');
        console.log(JSON.stringify(error));
      });

      this.twitterStream.on('end', () => {
        this.twitterStream.destroy();
        this.handleTwitterStream();
      });
    }
  };

  loginToDiscord = async () => {
    this.client.login(this.discordToken);
    return new Promise((resolve) => {
      this.client.on('ready', () => {
        console.log(`Logged in as ${this.client.user.tag}!`);
        this.isLoggedIn = true;
        resolve(true);
      });
    });
  };

  logoutOfDiscord = () => {
    console.log('Destroying discord client');
    this.isLoggedIn = false;
    return this.client.destroy();
  };

  attachListeners = () => {
    this.handleTwitterStream();
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
      } else if (_.startsWith(msg.content, BOT_COMMANDS.TWEET_REPLY.command)) {
        isTweetingServer(msg) && sendReply(msg);
        return;
      } else if (_.startsWith(msg.content, BOT_COMMANDS.RETWEET.command)) {
        isTweetingServer(msg) && retweet(msg);
        return;
      } else if (doesMsgContainInstagram(msg)) {
        isKpopChannel(msg) && sendInstagramEmbeds(msg);
        return;
      } else if (_.startsWith(msg.content, '$')) {
        getCryptocurrencyPrice(msg);
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
          break;
        case BOT_COMMANDS.KPOP.command:
          isKpopChannel(msg) && Kpop.onKpopCommand(msg);
          break;
        case BOT_COMMANDS.KST.command:
          sendMessageToChannel(msg, Kpop.getTimeInKST());
          break;
        case BOT_COMMANDS.IRCRESET.command:
          if (OVERRIDES?.shellCommand) {
            exec(OVERRIDES.shellCommand);
          }
          break;
        case BOT_COMMANDS.COSPLAY.command:
          // sendCosplayTweet(msg);
          break;
        case BOT_COMMANDS.TRIVIA.command:
          isCasinoChannel(msg) && this.triviaManager.createNewTrivia(msg, this.client);
          break;
      }
    });
  };

  getChannelsToSendTo = (embed) => {
    if (
      embed?.url.includes('https://www.vlive.tv') &&
      CONSTANTS?.[this.serverName]?.vliveOverride
    ) {
      return CONSTANTS?.[this.serverName]?.vliveOverride;
    }
    return CONSTANTS?.[this.serverName]?.streamChannels;
  };

  sendEmbed = (streamMessage, embed = '') => {
    const channelsToSendTo = this.getChannelsToSendTo(embed);

    for (const channelToSendTo of channelsToSendTo) {
      this.client.channels.cache
        .find((channel) => channel.name === channelToSendTo && channel.type === 'text')
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
