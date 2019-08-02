import Deck from 'card-deck';
import _ from 'lodash';
import { Helpers } from './helpers.js';
import { BOT_COMMANDS, BLACKJACK_MONEY } from './constants_internal.js';
import { MoneyManager } from './moneymanager.js';
import { Database } from './database.js';

class Blackjack {
  constructor() {
    this.isGameStarted = false;
    this.msg = null;
    this.cardTypes = {
      SUIT: 'suit',
      DISPLAY: 'display',
      VALUE: 'value'
    };
    this.deck = new Deck(require('./cards.json'));
    this.betSize = null;
  }

  getActions = () => {
    let actions = `${BOT_COMMANDS.BLACKJACK_HIT.command} ${BOT_COMMANDS.BLACKJACK_DOUBLE.command} `;
    //if(this.isSplitable()) {
    //    actions += `${BOT_COMMANDS.BLACKJACK_HIT.split} `;
    //}
    actions += `or ${BOT_COMMANDS.BLACKJACK_STAND.command}`;
    return actions;
  };

  isBlackJack = hand => {
    return this.sumifyHand(hand) === 21;
  };

  isSplitable = () => {
    if (this.playerHand[0][this.cardTypes.VALUE] === this.playerHand[1][this.cardTypes.VALUE]) {
      return true;
    }
    return false;
  };

  handleInitialBlackjack = (initialMessageToSend, isPlayerBlackjack, isDealerBlackjack) => {
    if (isPlayerBlackjack && isDealerBlackjack) {
      initialMessageToSend += `\nDealer has **${this.stringifyHand(
        this.dealerHand,
        this.cardTypes.DISPLAY
      ).join(' ')}** \nBoth Dealer and ${this.msg.author.username} have Blackjack. It's a push bro`;
      Helpers.sendMessageToChannel(this.msg, initialMessageToSend);
      this.clearGame();
    } else if (isPlayerBlackjack) {
      initialMessageToSend += `\n${this.msg.author.username} has Blackjack. Nice one bro`;
      MoneyManager.addMoney(this.msg, Math.ceil(this.betSize * BLACKJACK_MONEY.BLACKJACK_PAYOUT));
      Helpers.sendMessageToChannel(this.msg, initialMessageToSend);
      this.clearGame();
    } else if (isDealerBlackjack) {
      initialMessageToSend += `\nDealer has **${this.stringifyHand(
        this.dealerHand,
        this.cardTypes.DISPLAY
      ).join(' ')}** \nDealer has Blackjack. Get owned bro`;
      MoneyManager.removeMoney(this.msg, this.betSize);
      Helpers.sendMessageToChannel(this.msg, initialMessageToSend);
      this.clearGame();
    }
  };

  timeout = () => {
    if (this.msg) {
      Helpers.sendMessageToChannel(this.msg, `${this.msg.author.username} timed out, cmon bro`);
      this.clearGame();
    }
  };

  setTimer = () => {
    const THIRTY_SECONDS = 30000;
    return setTimeout(this.timeout, THIRTY_SECONDS);
  };

  clearAndResetTimer = () => {
    clearTimeout(this.timer);
    this.timer = this.setTimer();
  };

  initGame = msg => {
    Database.initializeUser(msg.channel.guild.name, msg.author.username);
    const betSize = Helpers.getBlackjackBetsize(msg);
    if (betSize) {
      if (MoneyManager.isEnoughMoney(msg, betSize)) {
        this.betSize = betSize;
      } else {
        MoneyManager.printNotEnoughMoney(msg);
        return;
      }
    } else {
      Helpers.printSpecifyBetSize(msg);
      return;
    }
    this.isGameStarted = true;
    this.msg = msg;
    this.deck.shuffle();
    this.playerHand = this.drawCards(2);
    this.dealerHand = this.drawCards(2);

    let initialMessageToSend =
      `Dealer has **${this.dealerHand[0].display}**` +
      `\n` +
      `${this.msg.author.username} has **${this.stringifyHand(
        this.playerHand,
        this.cardTypes.DISPLAY
      ).join(' ')}**`;

    let isPlayerBlackjack = this.isBlackJack(this.playerHand),
      isDealerBlackjack = this.isBlackJack(this.dealerHand);

    this.timer = this.setTimer();
    this.handleInitialBlackjack(initialMessageToSend, isPlayerBlackjack, isDealerBlackjack);
    if (this.msg) {
      initialMessageToSend += `\n${this.getActions()}`;
      Helpers.sendMessageToChannel(this.msg, initialMessageToSend);
    }
  };

  clearGame = () => {
    this.isGameStarted = false;
    this.msg = null;
    this.deck.shuffleToTop(this.playerHand);
    this.deck.shuffleToTop(this.dealerHand);
    this.playerHand = null;
    this.dealerHand = null;
    this.betSize = null;
    clearTimeout(this.timer);
  };

  isValidUser = msg => {
    return this.msg.author.username === msg.author.username;
  };

  endGame = dealerHandMessages => {
    const playerHandValue = this.sumifyHand(this.playerHand),
      dealerHandValue = this.sumifyHand(this.dealerHand);

    if (dealerHandValue > 21) {
      dealerHandMessages += `\nDealer busts with **${dealerHandValue}**. ${
        this.msg.author.username
      } wins with **${playerHandValue}**, good job bro`;
      MoneyManager.addMoney(this.msg, this.betSize);
    } else if (dealerHandValue <= 21) {
      dealerHandMessages +=
        `\n${
          this.msg.author.username
        } has **${playerHandValue}** and Dealer has **${dealerHandValue}**` + `\n`;

      if (dealerHandValue > playerHandValue) {
        dealerHandMessages += `Dealer wins, sorry bro`;
        MoneyManager.removeMoney(this.msg, this.betSize);
      } else if (dealerHandValue < playerHandValue) {
        dealerHandMessages += `${this.msg.author.username} wins, good job bro`;
        MoneyManager.addMoney(this.msg, this.betSize);
      } else {
        dealerHandMessages += `It's a push bro`;
      }
    }
    Helpers.sendMessageToChannel(this.msg, dealerHandMessages);
    this.clearGame();
  };

  stand = msg => {
    if (!this.isValidUser(msg)) {
      return;
    }
    const playerHandValue = this.sumifyHand(this.playerHand);
    let dealerHandValue = this.sumifyHand(this.dealerHand),
      dealerHandMessages = `Dealer has **${this.stringifyHand(
        this.dealerHand,
        this.cardTypes.DISPLAY
      ).join(' ')}**`;

    if (dealerHandValue > 16) {
      this.endGame(dealerHandMessages);
      return;
    }

    while (dealerHandValue <= 16) {
      this.dealerHand.push(this.drawCards(1));
      dealerHandMessages += `\nDealer has **${this.stringifyHand(
        this.dealerHand,
        this.cardTypes.DISPLAY
      ).join(' ')}**`;

      dealerHandValue = this.sumifyHand(this.dealerHand);
    }
    this.endGame(dealerHandMessages);
  };

  hit = msg => {
    if (!this.isValidUser(msg)) {
      return;
    }
    this.clearAndResetTimer();
    this.playerHand.push(this.drawCards(1));
    let messageToSend = `${this.msg.author.username} has **${this.stringifyHand(
      this.playerHand,
      this.cardTypes.DISPLAY
    ).join(' ')}**`;
    const playerHandValue = this.sumifyHand(this.playerHand);
    if (playerHandValue > 21) {
      Helpers.sendMessageToChannel(
        this.msg,
        `${messageToSend}\n${
          this.msg.author.username
        }'s busts with **${playerHandValue}**. Dealer wins, sorry bro`
      );
      MoneyManager.removeMoney(this.msg, this.betSize);
      this.clearGame();
    } else if (playerHandValue === 21) {
      Helpers.sendMessageToChannel(this.msg, messageToSend);
      this.stand(msg);
    } else {
      Helpers.sendMessageToChannel(this.msg, messageToSend);
    }
  };

  double = msg => {
    if (!this.isValidUser(msg)) {
      return;
    }
    if (this.playerHand.length > 2) {
      return;
    }
    this.clearAndResetTimer();
    this.playerHand.push(this.drawCards(1));
    this.betSize = MoneyManager.getBalanceForBlackjackDouble(msg, this.betSize);
    let messageToSend = `${this.msg.author.username} has **${this.stringifyHand(
      this.playerHand,
      this.cardTypes.DISPLAY
    ).join(' ')}**`;
    const playerHandValue = this.sumifyHand(this.playerHand);
    if (playerHandValue > 21) {
      Helpers.sendMessageToChannel(
        this.msg,
        `${messageToSend}\n${
          this.msg.author.username
        }'s busts with **${playerHandValue}**. Dealer wins, sorry bro`
      );
      MoneyManager.removeMoney(this.msg, this.betSize);
      this.clearGame();
    } else {
      Helpers.sendMessageToChannel(this.msg, messageToSend);
      this.stand(msg);
    }
  };

  split = msg => {
    // TODO (one day)
    if (!this.isValidUser(msg)) {
      return;
    }
    //this.clearAndResetTimer();
  };

  stringifyHand = (hand, property) => {
    return hand.map(card => card[property]);
  };

  numberOfAcesInHand = hand => {
    let aces = _.countBy(hand, function(card) {
      return card.display == 'A';
    });
    return _.get(aces, 'true', 0);
  };

  sumifyHand = hand => {
    let handValue = _.sum(this.stringifyHand(hand, this.cardTypes.VALUE)),
      numberOfAces = this.numberOfAcesInHand(hand);

    // aces logic
    while (numberOfAces > 0) {
      if (handValue > 21) {
        handValue -= 10;
        numberOfAces -= 1;
      } else {
        break;
      }
    }
    return handValue;
  };

  drawCards = (numberOfCards = 1) => {
    return this.deck.draw(numberOfCards);
  };
}

export default Blackjack;
