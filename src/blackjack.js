import Deck from 'card-deck';

class Blackjack {

    constructor(message) {
        this.gameStarted = true;
        this.message = message;
        this.deck = new Deck(require('./cards.json'));
        this.initGame();
    }

    initGame = () => {
        this.deck.shuffle();
    }

    drawCards = (numberOfCards = 1) => {
        return this.deck.draw(numberOfCards);
    }
}

export default Blackjack;