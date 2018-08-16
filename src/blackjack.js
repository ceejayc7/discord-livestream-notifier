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
    }

    isBlackJack = (hand) => {
        return this.sumifyHand(hand) === 21;
    }

    isSplitable = () => {
        if(this.playerHand[0][this.cardTypes.VALUE] === this.playerHand[1][this.cardTypes.VALUE]) {
            return true;
        }
        return false;
    }

    handleInitialBlackjack = (isPlayerBlackjack, isDealerBlackjack) => {
        if(isPlayerBlackjack && isDealerBlackjack) {
            Helpers.sendMessageToChannel(this.msg, `Dealer has **${this.stringifyHand(this.dealerHand, this.cardTypes.DISPLAY).join(' ')}** \nBoth Dealer and ${this.msg.author.username} have Blackjack. It's a push bro`);
            this.clearGame();
        }
        else if(isPlayerBlackjack) {
            Helpers.sendMessageToChannel(this.msg, `${this.msg.author.username} has Blackjack. Nice one bro`);
            MoneyManager.addMoney(this.msg, Math.ceil(this.betSize*BLACKJACK_MONEY.BLACKJACK_PAYOUT));
            this.clearGame();
        }
        else if(isDealerBlackjack) {
            Helpers.sendMessageToChannel(this.msg, `Dealer has **${this.stringifyHand(this.dealerHand, this.cardTypes.DISPLAY).join(' ')}** \nDealer has Blackjack. Get owned bro`);
            MoneyManager.removeMoney(this.msg, this.betSize);
            this.clearGame();
        }
    }

    timeout = () => {
        if(this.msg) {
            Helpers.sendMessageToChannel(this.msg, `${this.msg.author.username} timed out, cmon bro`);
            this.clearGame();
        }
    }

    setTimer = () => {
        const THIRTY_SECONDS = 30000;
        return setTimeout(this.timeout, THIRTY_SECONDS);
    }

    clearAndResetTimer = () => {
        clearTimeout(this.timer);
        this.timer = this.setTimer();
    }

    initGame = (msg) => {
        const key = `/${msg.channel.guild.name}/${msg.author.username}`;
        Database.initializeUser(key);
        const betSize = Helpers.getBlackjackBetsize(msg);
        if(betSize) {
            if(MoneyManager.isEnoughMoney(msg, betSize)) {
                this.betSize = betSize 
            } else {
                return;
            }
        }
        else {
            Helpers.printSpecifyBetSize(msg);
            return;
        }
        this.isGameStarted = true;
        this.msg = msg;
        this.deck.shuffle();
        this.playerHand = this.drawCards(2);
        this.dealerHand = this.drawCards(2);

        let initalMessageToSend = `Dealer has **${this.dealerHand[0].display}**` + `\n` + `${this.msg.author.username} has **${this.stringifyHand(this.playerHand, this.cardTypes.DISPLAY).join(' ')}**` + `\n` + this.getActions();

        Helpers.sendMessageToChannel(this.msg, initalMessageToSend);

        let isPlayerBlackjack = this.isBlackJack(this.playerHand),
            isDealerBlackjack = this.isBlackJack(this.dealerHand);

        this.timer = this.setTimer();
        this.handleInitialBlackjack(isPlayerBlackjack, isDealerBlackjack);
    }

    clearGame = () => {
        this.isGameStarted = false;
        this.msg = null;
        this.deck.shuffleToTop(this.playerHand);
        this.deck.shuffleToTop(this.dealerHand);
        this.playerHand = null
        this.dealerHand = null;
        this.betSize = null;
        clearTimeout(this.timer);
    } 

    isValidUser = (msg) => {
        return this.msg.author.username === msg.author.username;
    }

    endGame = () => {
        const playerHandValue = this.sumifyHand(this.playerHand),
            dealerHandValue = this.sumifyHand(this.dealerHand);

        let messageToSend = '';

        if(dealerHandValue > 21) {
            messageToSend += `Dealer busts with **${dealerHandValue}**. ${this.msg.author.username} wins with **${playerHandValue}**, good job bro`;
            MoneyManager.addMoney(this.msg, this.betSize);
        }
        else if(dealerHandValue <= 21) {
            messageToSend += `${this.msg.author.username} has **${playerHandValue}** and Dealer has **${dealerHandValue}**` + `\n`;

            if(dealerHandValue > playerHandValue) {
                messageToSend += `Dealer wins, sorry bro`
                MoneyManager.removeMoney(this.msg, this.betSize);
            }

            else if(dealerHandValue < playerHandValue) {
                messageToSend += `${this.msg.author.username} wins, good job bro`;
                MoneyManager.addMoney(this.msg, this.betSize);
            }
            else {
                messageToSend += `It's a push bro`;
            }
        }
        Helpers.sendMessageToChannel(this.msg, messageToSend);
        this.clearGame();
    }

    stand = (msg) => {
        if(!this.isValidUser(msg)) {
            return;
        }
        const playerHandValue = this.sumifyHand(this.playerHand);
        let dealerHandValue = this.sumifyHand(this.dealerHand);
        
        Helpers.sendMessageToChannel(this.msg, `Dealer has **${this.stringifyHand(this.dealerHand, this.cardTypes.DISPLAY).join(' ')}**` + `\n`);

        if(dealerHandValue > 16) {
            this.endGame(dealerHandValue, playerHandValue);
            return;
        }

        while (dealerHandValue <= 16) {
            this.dealerHand.push(this.drawCards(1));
            Helpers.sendMessageToChannel(this.msg, `Dealer has **${this.stringifyHand(this.dealerHand, this.cardTypes.DISPLAY).join(' ')}**` + `\n`);

            dealerHandValue = this.sumifyHand(this.dealerHand);
        }
        this.endGame(dealerHandValue, playerHandValue);
    }

    hit = (msg) => {
        if(!this.isValidUser(msg)) {
            return;
        }
        this.clearAndResetTimer();
        this.playerHand.push(this.drawCards(1));
        Helpers.sendMessageToChannel(this.msg, `${this.msg.author.username} has **${this.stringifyHand(this.playerHand, this.cardTypes.DISPLAY).join(' ')}**`);
        const playerHandValue = this.sumifyHand(this.playerHand);
        if(playerHandValue > 21) {
            Helpers.sendMessageToChannel(this.msg, `${this.msg.author.username}'s busts with **${playerHandValue}**. Dealer wins, sorry bro`);
            MoneyManager.removeMoney(this.msg, this.betSize);
            this.clearGame();
        }
    }

    double = (msg) => {
        if(!this.isValidUser(msg)) {
            return;
        }
        this.clearAndResetTimer();
        this.playerHand.push(this.drawCards(1));
        this.betSize = MoneyManager.getBalanceForBlackjackDouble(msg, this.betSize);
        Helpers.sendMessageToChannel(this.msg, `${this.msg.author.username} has **${this.stringifyHand(this.playerHand, this.cardTypes.DISPLAY).join(' ')}**`);
        const playerHandValue = this.sumifyHand(this.playerHand);
        if(playerHandValue > 21) {
            Helpers.sendMessageToChannel(this.msg, `${this.msg.author.username}'s busts with **${playerHandValue}**. Dealer wins, sorry bro`);
            MoneyManager.removeMoney(this.msg, this.betSize);
            this.clearGame();
        }
        else {
            this.stand(msg);
        }
    }

    split = (msg) => {
        // TODO (one day)
        if(!this.isValidUser(msg)) {
            return;
        }
        //this.clearAndResetTimer();

    }

    stringifyHand = (hand, property) => {
        return hand.map(card => card[property]);
    }
    
    numberOfAcesInHand = (hand) => {
        let aces = _.countBy(hand, function(card) { 
            return card.display == "A";
        });
        return _.get(aces, 'true', 0);
    }

    sumifyHand = (hand) => {
        let handValue = _.sum(this.stringifyHand(hand, this.cardTypes.VALUE)),
            numberOfAces = this.numberOfAcesInHand(hand);
        
        // aces logic
        while (numberOfAces > 0) {
            if(handValue > 21) {
                handValue -= 10;
                numberOfAces -= 1;
            }
            else {
                break;
            }
        }
        return handValue;
    }
    
    drawCards = (numberOfCards = 1) => {
        return this.deck.draw(numberOfCards);
    }
}

export default Blackjack;