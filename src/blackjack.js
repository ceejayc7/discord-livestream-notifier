import Deck from 'card-deck';
import _ from 'lodash';

class Blackjack {
    constructor() {
        this.isGameStarted = false;
        this.msg = null;
        this.cardTypes = {
            SUIT: 'suit',
            DISPLAY: 'display',
            VALUE: 'value'
        };
    }

    hitOrStand = () => {
        return `!hit or !stand`;
    }

    messageError = (error) => {
        console.log(`Unable to send message during !21. ${error.message}`);
    }

    isBlackJack = (hand) => {
        return this.sumifyHand(hand) === 21;
    }

    handleInitialBlackjack = (isPlayerBlackjack, isDealerBlackjack) => {
        if(isPlayerBlackjack && isDealerBlackjack) {
            this.sendMessageToChannel(`Both Dealer and ${this.msg.author.username} have Blackjack. It's a tie bro`);
            this.clearGame();
        }
        else if(isPlayerBlackjack) {
            this.sendMessageToChannel(`${this.msg.author.username} has Blackjack. Nice one bro`);
            this.clearGame();
        }
        else if(isDealerBlackjack) {
            this.sendMessageToChannel(`Dealer's hand is ${this.stringifyHand(this.dealerHand, this.cardTypes.DISPLAY).join(' ')} \n Dealer has Blackjack. Get owned bro`);
            this.clearGame();
        }
    }

    timeout = () => {
        if(this.msg) {
            this.sendMessageToChannel(`${this.msg.author.username} timed out, cmon bro`);
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
        this.isGameStarted = true;
        this.msg = msg;
        this.deck = new Deck(require('./cards.json'));
        this.deck.shuffle();
        this.playerHand = this.drawCards(2);
        this.dealerHand = this.drawCards(2);

        let initalMessageToSend = `Dealer has **${this.dealerHand[0].display}**` + `\n` + `${this.msg.author.username}'s hand is **${this.stringifyHand(this.playerHand, this.cardTypes.DISPLAY).join(' ')}**` + `\n` + this.hitOrStand();

        this.sendMessageToChannel(initalMessageToSend);

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
        clearTimeout(this.timer);
    } 

    isValidUser = (msg) => {
        return this.msg.author.username === msg.author.username;
    }

    sendMessageToChannel = (stringToSend) => {
        this.msg.channel.send(stringToSend)
            .catch(this.messageError);
    }

    endGame = (dealerHandValue, playerHandValue) => {
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
                messageToSend += `It's a tie bro`;
            }
        }
        this.sendMessageToChannel(messageToSend);
        this.clearGame();
    }

    stand = (msg) => {
        if(!this.isValidUser(msg)) {
            return;
        }
        const playerHandValue = this.sumifyHand(this.playerHand);
        let dealerHandValue = this.sumifyHand(this.dealerHand);
        
        this.sendMessageToChannel(`Dealer has **${this.stringifyHand(this.dealerHand, this.cardTypes.DISPLAY).join(' ')}**` + `\n`);

        if(dealerHandValue > 16 || dealerHandValue > playerHandValue) {
            this.endGame(dealerHandValue, playerHandValue);
            return;
        }

        while (dealerHandValue <= 16) {
            this.dealerHand.push(this.drawCards(1));
            this.sendMessageToChannel(`Dealer has **${this.stringifyHand(this.dealerHand, this.cardTypes.DISPLAY).join(' ')}**` + `\n`);

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
        this.sendMessageToChannel(`${this.msg.author.username}'s hand is **${this.stringifyHand(this.playerHand, this.cardTypes.DISPLAY).join(' ')}**`);
        const playerHandValue = this.sumifyHand(this.playerHand);
        if(playerHandValue > 21) {
            this.sendMessageToChannel(`${this.msg.author.username}'s busts with **${playerHandValue}**. Dealer wins, sorry bro`);
            this.clearGame();
        }
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