const CardDeck = require('../../common/cards');

function CardPicker (Socketio) {

    var deck = null;

    var startGame = () => {
        console.log("GAME STARTING IN 3...");
    }

    var addPlayer = () => {

    }

    var resetGame = () => {

    }

    var sendCurrentState = () => {
        Socketio.emit("game-data", {
            cards: deck.cards
        })
    }

    var initializeDeck = () => {
        deck = new CardDeck();
    }
    
    Socketio.on("connection", socket => {
        initializeDeck();
        sendCurrentState();
        socket.on("start", () => {
            startGame();
        })
        socket.on("join", data => {
            addPlayer(data)
        })
        socket.on("reset", () => {
            resetGame()
        })
        socket.on("get-game-data", () => {
            sendCurrentState()
        })
    });
}

module.exports = {
    create: CardPicker
}