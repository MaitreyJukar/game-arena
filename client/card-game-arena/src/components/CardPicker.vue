<template>
    <div class="main-container">
      <div class="cards-container">
        <template v-for="card of cards">
            <Card :flipped="card.flipped" :suit="card.suit" :cardVal="card.cardVal"></Card>
        </template>
      </div>
    </div>
  </template>
  
  <script>
  import { io } from "socket.io-client";
  import { uuidv4 } from '../utils/helpers';
  import Card from './common/Card.vue';
  
  export default {
    name: "CardPicker",
    components: {
        Card
    },
    data() {
      return {
        socket: {},
        players: [],
        pName: "",
        playerID: uuidv4(),
        cards: []
      };
    },
    computed: {
      joined() {
        return !!this.players.find((p) => p.id == this.playerID);
      }
    },
    created() {
      this.socket = io("http://localhost:3000/card-picker", {
        transports: ["websocket"],
      });
    },
    mounted() {
      this.socket.on("game-data", (data) => {
        this.cards = data.cards;
      })
    },
    methods: {
    },
  };
  </script>
  
  <style>
  </style>
  
  <style scoped>
  .main-container * {
    user-select: none;
    font-family: 'PressStart2P';
  }

  .main-container .cards-container .card-container {
    width: calc(92% / 13);
    height: calc(92vh / 4);
    min-height: 30px;
    max-height: 145px;
  }
  </style>