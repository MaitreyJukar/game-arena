const SERVER_HOST = "http://192.168.0.117";
const SERVER_PORT = "8001";
const CLIENT_HOST = "http://192.168.0.117";

const Express = require("express")();
const Http = require("http").Server(Express);
const Socketio = require("socket.io")(Http, {
    cors: {
        origin: SERVER_HOST,
        methods: ["GET", "POST"]
    }
});
const GAME_STATES = {
    WAITING: "WAITING",
    READY: "READY",
    ON: "ON",
    PAUSED: "PAUSED",
    POINT: "POINT",
    VICTORY: "VICTORY"
}
const TIMER = 10;
const GAME_WIDTH = 640;
const GAME_HEIGHT = 480;
const BALL_SIZE = 20;
const PADEL_HEIGHT = 60;
const PADEL_WIDTH = 20;
const WINNING_SCORE = 5;
const SPEED_INCR_TIMER = 10000;

var dirY = "n";
var dirX = "e";
var ballDelta = 1;
var padelDelta = 10;
var interval = null;
var speedTimeout = null;
var players = [];
var gameState = GAME_STATES.WAITING;

var position = {
    x: GAME_WIDTH / 2,
    y: GAME_HEIGHT / 2
};

var padelAPosition = {
    x: 5,
    y: GAME_HEIGHT / 2 - PADEL_HEIGHT / 2
}

var padelBPosition = {
    x: GAME_WIDTH - 5 - PADEL_WIDTH,
    y: GAME_HEIGHT / 2 - PADEL_HEIGHT / 2
}

Socketio.on("connection", socket => {
    sendCurrentState();
    socket.on("move", data => {
        moveBall(data);
    });
    socket.on("start", () => {
        startGame();
    })
    socket.on("pause", () => {
        pauseGame();
    })
    socket.on("move-padel", data => {
        movePadel(data)
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

var moveBall = function (direction) {
    switch (direction) {
        case "left":
            position.x -= ballDelta;
            break;
        case "right":
            position.x += ballDelta;
            break;
        case "up":
            position.y -= ballDelta;
            break;
        case "down":
            position.y += ballDelta;
            break;
        case "se":
            position.y += ballDelta;
            position.x += ballDelta;
            break;
        case "sw":
            position.y += ballDelta;
            position.x -= ballDelta;
            break;
        case "ne":
            position.y -= ballDelta;
            position.x += ballDelta;
            break;
        case "nw":
            position.y -= ballDelta;
            position.x -= ballDelta;
            break;
    }
    Socketio.emit("position", position)
}

var movePadel = function ({ direction, playerID }) {
    if (playerID == players[0]?.id) {
        movePadelA(direction)
    } else if (playerID == players[1]?.id) {
        movePadelB(direction)
    }
}

var movePadelA = function (direction) {
    switch (direction) {
        case "up":
            padelAPosition.y = Math.max(padelAPosition.y - padelDelta, 0)
            break;
        case "down":
            padelAPosition.y = Math.min(padelAPosition.y + padelDelta, GAME_HEIGHT - PADEL_HEIGHT);
            break;
    }
    Socketio.emit("padel-a-position", padelAPosition);
}

var movePadelB = function (direction) {
    switch (direction) {
        case "up":
            padelBPosition.y = Math.max(padelBPosition.y - padelDelta, 0)
            break;
        case "down":
            padelBPosition.y = Math.min(padelBPosition.y + padelDelta, GAME_HEIGHT - PADEL_HEIGHT);
            break;
    }
    Socketio.emit("padel-b-position", padelBPosition);
}

var startGame = function () {
    ballDelta = 1;
    padelDelta = 10;
    interval = setInterval(() => {
        const rightComparePos = position.x + BALL_SIZE / 2;
        const leftComparePos = position.x - BALL_SIZE / 2;
        if (rightComparePos >= padelBPosition.x && rightComparePos < GAME_WIDTH) {
            if (((position.y - BALL_SIZE / 2) <= (padelBPosition.y + PADEL_HEIGHT)) &&
                (position.y + BALL_SIZE / 2) >= padelBPosition.y) {
                dirX = "w"
            }
        } else if (leftComparePos > 0 && leftComparePos <= padelAPosition.x + PADEL_WIDTH) {
            if (((position.y - BALL_SIZE / 2) <= (padelAPosition.y + PADEL_HEIGHT)) &&
                (position.y + BALL_SIZE / 2) >= padelAPosition.y) {
                dirX = "e"
            }
        }
        else if (position.x + BALL_SIZE / 2 >= GAME_WIDTH) {
            pointScored(players[0]);
        } else if (position.x - BALL_SIZE / 2 <= 0) {
            pointScored(players[1]);
        }
        if (position.y + BALL_SIZE / 2 >= GAME_HEIGHT) {
            dirY = "n";
        } else if (position.y - BALL_SIZE / 2 <= 0) {
            dirY = "s";
        }
        moveBall(`${dirY}${dirX}`);
    }, TIMER)
    speedTimeout = setTimeout(() => {
        ballDelta++;
        padelDelta += 10;
    }, SPEED_INCR_TIMER)
    gameState = GAME_STATES.ON;
    Socketio.emit("game-start", gameState);
}

var pauseGame = function () {
    clearInterval(interval);
    gameState = GAME_STATES.PAUSED;
    Socketio.emit("game-paused", gameState);
}

var pointScored = function (player) {
    clearInterval(interval);
    resetBoard();
    player.score++;
    gameState = GAME_STATES.POINT;
    if (player.score >= WINNING_SCORE) {
        gameState = GAME_STATES.VICTORY;
    }
    Socketio.emit("point-scored", player, players, gameState);
    if (gameState == GAME_STATES.VICTORY) {
        Socketio.emit("game-won", player, players, gameState);
    }
}

var resetBoard = function () {
    position = {
        x: GAME_WIDTH / 2,
        y: GAME_HEIGHT / 2
    };

    padelAPosition = {
        x: 5,
        y: GAME_HEIGHT / 2 - PADEL_HEIGHT / 2
    }

    padelBPosition = {
        x: GAME_WIDTH - 5 - PADEL_WIDTH,
        y: GAME_HEIGHT / 2 - PADEL_HEIGHT / 2
    }

    ballDelta = 1;
    padelDelta = 10;
}

var resetGame = function () {
    pauseGame();
    resetBoard();
    players = [];
    gameState = GAME_STATES.WAITING;
    Socketio.emit("game-reset", gameState);
}

var addPlayer = function (player) {
    if (players.length < 2) {
        player.score = 0;
        player.idx = players.length;
        players.push(player);
        Socketio.emit(`player-${players.length}-joined`, player);
        if (players.length == 2) {
            gameState = GAME_STATES.READY;
            Socketio.emit("game-ready", gameState);
        }
    }
}

var sendCurrentState = function () {
    Socketio.emit("game-data", {
        players,
        ballPosition: position,
        padelAPosition,
        padelBPosition,
        gameState
    })
}

Http.listen(3000, () => {
    console.log("Listening at :3000...");
});