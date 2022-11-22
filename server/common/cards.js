const Utils = require("./utils");
const _ = require('lodash');

const SUITS = [
    'spade',
    'heart',
    'club',
    'diamond'
];

const SUIT_SYMBOL = {
    'spade': '♠️',
    'heart': '♥️',
    'club': '♣️',
    'diamond': '♦️'
};

const CARD_VALUES = [
    '2',
    '3',
    '4',
    '5',
    '6',
    '7',
    '8',
    '9',
    '10',
    'J',
    'Q',
    'K',
    'A'
];

module.exports = class CardDeck {
    cards = null;

    constructor(options) {
        this._initialize();
        this.distribute();
        return this;
    }
    
    _initialize() {
        this.cards = this._generateDeck();
    };
    
    _generateDeck() {
        const _cards = [];
        for (let suit of SUITS) {
            for (let val of CARD_VALUES) {
                _cards.push({
                    suit: suit,
                    cardVal: val,
                    flipped: true,
                    id: Utils.uuidv4()
                })
            }
        }
        return _.shuffle(_cards);
    }

    distribute(options = {}) {
        const deck = this.cards.slice();
        const PLAYER_COUNT = options.players || 2;
        const playerHands = [];

        /** Generate Empty Hands */
        while (playerHands.length < PLAYER_COUNT) {
            playerHands.push([]);
        }

        /** Distribute cards */
        for (; deck.length >= PLAYER_COUNT; ) {
            for (let p = 0; p < playerHands.length; p++) {
                playerHands[p].push(deck.shift())
            }
        }
        
        return playerHands;
    }

    toString(cards) {
        return cards.map(c => `${SUIT_SYMBOL[c.suit]} ${c.cardVal}`).join();
    }
}