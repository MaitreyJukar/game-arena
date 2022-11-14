<template>
  <div class="main-container">
    <ConfettiExplosion v-if="gameState == GAME_STATES.POINT || gameState == GAME_STATES.VICTORY" :particleCount="200" />
    <div class="game-title">
      <a-typography-title>LET'S PLAY</a-typography-title>
    </div>
    <div class="game-container">
      <div class="play-summary">
        <a-button class="move-up move-btn" type="primary" @mousedown="startMove('up')">
          <template #icon><caret-up-outlined /></template>
        </a-button>
        <div v-if="p1" class="player-details">
          <div class="player-name">{{ p1.name }}</div>
          <div class="player-score">{{ p1.score }}</div>
        </div>
        <a-button class="move-down move-btn" type="primary" @mousedown="startMove('down')">
          <template #icon><caret-down-outlined /></template>
        </a-button>
      </div>
      <div class="pitch">
        <div class="divider"></div>
        <div class="center-circle"></div>
        <canvas ref="game" width="640" height="480"></canvas>
      </div>
      <div class="play-summary">
        <a-button class="move-up move-btn" type="primary" @mousedown="startMove('up')">
          <template #icon><caret-up-outlined /></template>
        </a-button>
        <div v-if="p2" class="player-details">
          <div class="player-name">{{ p2.name }}</div>
          <div class="player-score">{{ p2.score }}</div>
        </div>
        <a-button class="move-down move-btn" type="primary" @mousedown="startMove('down')">
          <template #icon><caret-down-outlined /></template>
        </a-button>
      </div>
    </div>
    <div class="button-container">
      <input v-if="(gameState == GAME_STATES.WAITING) && !joined" class="player-name-ip" v-model="pName"
        placeholder="Player Name">
      <a-button type="primary" v-if="(gameState == GAME_STATES.WAITING) && !joined" @click="joinGame"
        :disabled="pName == ''">JOIN
      </a-button>
      <a-button type="primary" v-if="(gameState == GAME_STATES.WAITING) && joined" disabled>WAITING...</a-button>
      <a-button type="primary"
        v-if="(gameState == GAME_STATES.READY) || (gameState == GAME_STATES.PAUSED) || (gameState == GAME_STATES.POINT)"
        @click="startGame">START</a-button>
      <a-button type="primary" v-if="(gameState == GAME_STATES.ON)" @click="pauseGame">PAUSE</a-button>
      <a-button type="primary" class="reset-game-btn" danger @click="resetGame">RESET</a-button>
    </div>
  </div>
</template>

<script>
import { io } from "socket.io-client";
import { uuidv4 } from '../utils/helpers';
import ConfettiExplosion from "vue-confetti-explosion";
import { Modal, message } from 'ant-design-vue';
import { CaretUpOutlined, CaretDownOutlined } from '@ant-design/icons-vue';

const GAME_STATES = {
  WAITING: "WAITING",
  READY: "READY",
  ON: "ON",
  PAUSED: "PAUSED",
  POINT: "POINT",
  VICTORY: "VICTORY"
}
const HEIGHT = 480;
const WIDTH = 640;
const PADEL_HEIGHT = 60;
const PADEL_WIDTH = 20;
const BALL_SIZE = 20;

export default {
  name: "TableHockey",
  components: {
    ConfettiExplosion,
    CaretUpOutlined,
    CaretDownOutlined
  },
  data() {
    return {
      socket: {},
      context: {},
      ballPosition: {
        x: 0,
        y: 0,
      },
      padelAPosition: {
        x: 5,
        y: HEIGHT / 2 - PADEL_HEIGHT / 2
      },
      padelBPosition: {
        x: WIDTH - 5 - PADEL_WIDTH,
        y: HEIGHT / 2 - PADEL_HEIGHT / 2
      },
      gameState: GAME_STATES.WAITING,
      p1: null,
      p2: null,
      pName: "",
      playerID: uuidv4(),
      GAME_STATES: GAME_STATES
    };
  },
  computed: {
    joined() {
      return this.playerID == this.p1?.id || this.playerID == this.p2?.id;
    }
  },
  created() {
    this.socket = io("http://localhost:3000", {
      transports: ["websocket"],
    });
    const $self = this;
    window.addEventListener("keydown", evt => {
      switch (evt.key) {
        case "ArrowUp":
          $self.movePadel('up');
          break;
        case "ArrowDown":
          $self.movePadel('down');
          break;
      }
    })
  },
  mounted() {
    this.context = this.$refs.game.getContext("2d");
    this.socket.on("position", (data) => {
      this.ballPosition = data;
      window.requestAnimationFrame(() => {
        this.renderCanvas();
      })
    });
    this.socket.on("padel-a-position", (data) => {
      this.padelAPosition = data;
      window.requestAnimationFrame(() => {
        this.renderCanvas();
      })
    })
    this.socket.on("padel-b-position", (data) => {
      this.padelBPosition = data;
      window.requestAnimationFrame(() => {
        this.renderCanvas();
      })
    })
    this.socket.on("player-1-joined", (data) => {
      this.p1 = data;
    })
    this.socket.on("player-2-joined", (data) => {
      this.p2 = data;
    })
    this.socket.on("game-ready", this.setGameState)
    this.socket.on("game-start", this.setGameState)
    this.socket.on("game-paused", this.setGameState)
    this.socket.on("game-won", (winner, players, gameState) => {
      this.setGameState(gameState);
      this.victory(winner, players);
    })
    this.socket.on("point-scored", (scorer, players, gameState) => {
      if (gameState != GAME_STATES.VICTORY) {
        message.success({
          content: () => `${scorer.name} SCORES!`,
          class: 'point-scored-message',
          style: {
            marginTop: '20vh',
          },
        });
      }
      this.p1 = players[0];
      this.p2 = players[1];
      this.gameState = gameState
    })
    this.socket.on("game-reset", (gameState) => {
      this.resetAllValues(gameState)
    })
    this.socket.on("game-data", data => {
      this.setGameData(data)
    })
  },
  methods: {
    movePadel(direction) {
      this.socket.emit("move-padel", {
        playerID: this.playerID,
        direction
      });
    },
    startMove(direction) {
      let mousedown = true;
      const MOUSEDOWN_TIMER = 80;
      const interval = setInterval(() => {
        if (mousedown) {
          this.movePadel(direction)
        } else {
          clearInterval(interval);
        }
      }, MOUSEDOWN_TIMER);
      window.addEventListener("mouseup", () => {
        mousedown = false;
        clearInterval(interval)
      })
    },
    log(evt) {
      console.log(evt)
    },
    joinGame() {
      console.log(this.playerID);
      this.socket.emit("join", { name: this.pName, id: this.playerID });
    },
    startGame() {
      this.socket.emit("start");
    },
    pauseGame() {
      this.socket.emit("pause");
    },
    resetGame() {
      this.socket.emit("reset");
    },
    setGameData(data) {
      this.p1 = data.players[0] || null;
      this.p2 = data.players[1] || null;
      this.gameState = data.gameState;
      this.ballPosition = data.ballPosition;
      this.padelAPosition = data.padelAPosition;
      this.padelBPosition = data.padelBPosition;
      this.renderCanvas();
    },
    renderCanvas() {
      const width = this.$refs.game.width;
      const height = this.$refs.game.height;
      this.context.clearRect(
        0,
        0,
        width,
        height
      );
      this.context.beginPath();
      this.context.arc(this.ballPosition.x, this.ballPosition.y, BALL_SIZE / 2, 0, 2 * Math.PI);
      this.context.stroke();
      this.context.fillStyle = "orange";
      this.context.fill();
      this.context.fillStyle = "white";
      this.context.fillRect(this.padelAPosition.x, this.padelAPosition.y, PADEL_WIDTH, PADEL_HEIGHT);
      this.context.fillRect(this.padelBPosition.x, this.padelBPosition.y, PADEL_WIDTH, PADEL_HEIGHT);
    },
    resetAllValues(gameState) {
      this.p1 = null;
      this.p2 = null;
      this.gameState = gameState;
      this.pName = "";
      this.ballPosition = {
        x: WIDTH / 2,
        y: HEIGHT / 2,
      };
      this.padelAPosition = {
        x: 5,
        y: HEIGHT / 2 - PADEL_HEIGHT / 2
      };
      this.padelBPosition = {
        x: WIDTH - 5 - PADEL_WIDTH,
        y: HEIGHT / 2 - PADEL_HEIGHT / 2
      }
      this.renderCanvas();
    },
    setGameState(gameState) {
      this.gameState = gameState;
    },
    victory(player, players) {
      const MODAL_TIMER = 10000;
      const modal = Modal.success({
        title: `${player.name} WINS!!`,
        content: `${players[0].score} - ${players[1].score}`,
        centered: true,
        footer: null,
        wrapClassName: "victory-modal-wrapper",
        okText: "YAAAY! 🎉"
      });
      setTimeout(() => {
        modal.destroy();
      }, MODAL_TIMER);
    }
  },
};
</script>

<style>
.victory-modal-wrapper {
  font-family: 'PressStart2P';
}

.point-scored-message {
  font-family: 'PressStart2P';
}
</style>

<style scoped>
.main-container {
  display: flex;
  align-items: center;
  flex-flow: column;
  padding: 20px;
}

.main-container * {
  user-select: none;
}

.main-container .game-title * {
  font-family: PressStart2P;
}

.main-container .game-container {
  display: flex;
  align-items: center;
}

.main-container .pitch {
  display: inline-block;
  background: #28282B;
  border: 12px solid #c6ed9e;
  border-radius: 10px;
  outline: none;
  box-shadow: 0 0 24px #c6ed9e;
  position: relative;
  margin: 0 20px;
}

.main-container .pitch .divider {
  content: "";
  display: block;
  height: 100%;
  background: white;
  width: 4px;
  position: absolute;
  top: 0;
  left: calc(50% - 2px);
}

.main-container .pitch .center-circle {
  content: "";
  display: block;
  height: 200px;
  border: 4px solid white;
  width: 200px;
  position: absolute;
  top: calc(50% - 100px);
  left: calc(50% - 100px);
  border-radius: 50%;
}

.main-container .pitch canvas {
  position: relative;
}

.main-container .play-summary {
    display: flex;
    flex-direction: column;
    align-items: center;
    width: 200px;
}

.main-container .play-summary .move-btn {
    margin: 16px 0;
    height: 200px;
    width: 200px;
    border: 4px solid #0067c7;
    border-radius: 16px;
}


.main-container .play-summary .move-btn.ant-btn .anticon {
    font-size: 64px;
    color: rgb(231 130 35);
}

.main-container .player-details {
  font-family: PressStart2P;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  border: 2px solid #fff;
  border-radius: 8px;
  padding: 16px;
  width: 200px;
}

.main-container .player-details .player-name {
  width: 100%;
  text-align: center;
  border-bottom: 2px solid #fff;
  margin-bottom: 4px;
  padding-bottom: 4px;
}

.main-container .button-container {
  padding: 16px;
}

.main-container .button-container .reset-game-btn {
  margin-left: 8px;
}

.main-container .button-container .player-name-ip {
  margin-right: 8px;
  color: black;
}
</style>