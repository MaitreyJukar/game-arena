<template>
    <div class="card-container">
        <div v-if="!flipped" class="card-back"></div>
        <div v-if="flipped" class="card-front">
            <div class="card-top-val card-val-display" :class="suit">
                <div class="card-val">{{ cardVal }}</div>
                <div class="card-suit">{{ suitVal }}</div>
            </div>
            <div class="card-bottom-val card-val-display" :class="suit">
                <div class="card-val">{{ cardVal }}</div>
                <div class="card-suit">{{ suitVal }}</div>
            </div>
        </div>
    </div>
</template>

<script>
export default {
    name: "Card",
    components: {},
    props: {
        flipped: {
            type: Boolean,
            default: true
        },
        suit: {
            type: String,
            required: false
        },
        cardVal: {
            type: String,
            required: false
        }
    },
    data() {
        return {
        }
    },
    computed: {
        suitVal() {
            switch (this.suit) {
                case "heart":
                    return "♥️";
                case "spade":
                    return "♠️";
                case "diamond":
                    return "♦️";
                case "club":
                    return "♣️";
                default:
                    return "";
            }
        }
    },
    methods: {

    }
}
</script>

<style scoped>
.card-container {
    width: 120px;
    height: 180px;
    display: inline-block;
    border-radius: 8px;
    margin: 4px;
    background: #FDFBF9;
    box-shadow: 0px 3px 15px rgba(0,0,0,0.2);
    cursor: grab;
}

.card-container .card-back {
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
}

.card-container .card-back::after {
    content: "🤨";
    font-size: 100px;
    opacity: 0.75;
}

.card-container .card-front {
    position: relative;
    height: 100%;
}

.card-container .card-front .card-bottom-val.card-val-display {
    transform: scale(-1, -1);
    position: absolute;
    bottom: 0;
    right: 0;
}

.card-container .card-front .card-val-display {
    font-family: Lato;
    font-size: 12px;
    font-weight: bold;
    width: 20px;
    text-align: center;
}

.card-container .card-front .card-val-display .card-val {
    font-size: 12px;
    width: 24px;
    text-align: center;
}

.card-container .card-front .card-val-display .card-suit {
    font-size: 8px;
    width: 24px;
    text-align: center;
}

.card-container .card-val-display.heart .card-val,
.card-container .card-val-display.diamond .card-val {
    color: #ed1c2d;
}

.card-container .card-val-display.club .card-val,
.card-container .card-val-display.spade .card-val {
    color: #000;
}
</style>