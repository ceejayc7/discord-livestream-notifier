import Deck from 'card-deck';
import _ from 'lodash';
import {Helpers} from './helpers.js';

class Blackjack {
    constructor() {
        this.isGameStarted = false;
        this.msg = null;
        this.blackjack = require('engine-blackjack');
        this.game = null;
        this.actions = null;
    }

    initGame = (msg) => {
        this.isGameStarted = true;
        this.msg = msg;

        this.actions = this.blackjack.actions;
        this.game = new this.blackjack.Game();
        this.game.dispatch(this.actions.deal());
        let initalMessageToSend = `Dealer has **${this.stringifyDealerHand()}**` + `\n` + `${this.msg.author.username} has **${this.stringifyPlayerHand()}**` + `\n` + this.getActions();

        Helpers.sendMessageToChannel(this.msg, initalMessageToSend);

        let isPlayerBlackjack = this.getPlayerInfo().playerHasBlackjack,
            isDealerBlackjack = this.game.getState().dealerHasBlackjack;

        this.timer = this.setTimer();
        this.handleInitialBlackjack(isPlayerBlackjack, isDealerBlackjack);
    }

    handleInitialBlackjack = (isPlayerBlackjack, isDealerBlackjack) => {
        if(isPlayerBlackjack && isDealerBlackjack) {
            Helpers.sendMessageToChannel(this.msg, `Dealer has **${this.stringifyDealerHand()}** \nBoth Dealer and ${this.msg.author.username} have Blackjack. It's a push bro`);
            this.clearGame();
        }
        else if(isPlayerBlackjack) {
            Helpers.sendMessageToChannel(this.msg, `${this.msg.author.username} has Blackjack. Nice one bro`);
            this.clearGame();
        }
        else if(isDealerBlackjack) {
            Helpers.sendMessageToChannel(this.msg, `Dealer has Blackjack. Get owned bro`);
            this.clearGame();
        }
    }

    getDealerCards = () => {
        return this.game.getState().dealerCards;
    }

    getPlayerInfo = () => {
        return this.game.getState().handInfo.right;
    }

    stringifyPlayerHand = () => {
        return this.getPlayerInfo().cards.map(card => card.text).join(' ');
    }
    
    stringifyDealerHand = () => {
        return this.getDealerCards().map(card => card.text).join(' ');
    }

    sumifyPlayerHand = () => {
        return this.getPlayerInfo().playerValue.hi;
    }

    sumifyDealerHand = () => {
        return this.game.getState().dealerValue.hi;
    }

    clearGame = () => {
        this.isGameStarted = false;
        this.msg = null;
        this.game.dispatch(this.actions.surrender());
        this.game = null;
        this.actions = null;
        clearTimeout(this.timer);
    } 

    isValidUser = (msg) => {
        return this.msg.author.username === msg.author.username;
    }

    endGame = () => {
        const playerHandValue = this.sumifyPlayerHand(this.playerHand),
            dealerHandValue = this.sumifyDealerHand(this.dealerHand);
        let messageToSend = '';

        if(dealerHandValue > 21) {
            messageToSend += `Dealer busts with **${dealerHandValue}**. ${this.msg.author.username} wins with **${playerHandValue}**, good job bro`;
        }
        else if(dealerHandValue <= 21) {
            messageToSend += `${this.msg.author.username} has **${playerHandValue}** and Dealer has **${dealerHandValue}**` + `\n`;

            if(dealerHandValue > playerHandValue) {
                messageToSend += `Dealer wins, sorry bro`
            }

            else if(dealerHandValue < playerHandValue) {
                messageToSend += `${this.msg.author.username} wins, good job bro`;
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
        this.game.dispatch(this.actions.stand({position: 'right'}));
        this.game.dispatch(this.actions.showdown({position: 'right'}));
        
        Helpers.sendMessageToChannel(this.msg, `Dealer has **${this.stringifyDealerHand()}**` + `\n`);

        this.endGame();
    }

    hit = (msg) => {
        if(!this.isValidUser(msg)) {
            return;
        }
        this.clearAndResetTimer();
        this.game.dispatch(this.actions.hit({}));
        Helpers.sendMessageToChannel(this.msg, `${this.msg.author.username} has **${this.stringifyPlayerHand()}**`);
        if(this.getPlayerInfo().playerHasBusted) {
            Helpers.sendMessageToChannel(this.msg, `${this.msg.author.username}'s busts with **${this.sumifyPlayerHand()}**. Dealer wins, sorry bro`);
            this.clearGame();
        }
        else if(this.game.getState().stage === "done") {
            Helpers.sendMessageToChannel(this.msg, `Dealer has **${this.stringifyDealerHand()}**`);
            this.endGame();
        }
    }

    getActions = () => {
        const actions = this.getPlayerInfo().availableActions;
        let actionsString = '';
        if(actions.hit) {
            actionsString += '!hit or ';
        }
        if(actions.double) {
            actionsString += '!double or ';
        }
        if(actions.split) {
            actionsString += '!split or ';
        }
        if(actions.stand) {
            actionsString += '!stand or ';
        }
        if(actions) {
            actionsString = actionsString.slice(0, actionsString.length - 4);
        }
        return actionsString;
    }

    timeout = () => {
        if(this.msg) {
            Helpers.sendMessageToChannel(this.msg, `${this.msg.author.username} timed out, cmon bro`);
            this.clearGame();
        }
    }

    setTimer = () => {
        const THIRTY_SECONDS = 2147483647; //30000;
        return setTimeout(this.timeout, THIRTY_SECONDS);
    }

    clearAndResetTimer = () => {
        clearTimeout(this.timer);
        this.timer = this.setTimer();
    }

}

export default Blackjack;