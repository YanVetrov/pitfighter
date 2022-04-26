<template>
  <div
    style="position:fixed;top:20px;left:9px;border-radius:100%"
    :class="{ shadow: flip }"
    :style="{ zIndex: flip ? 1 : 0 }"
  >
    <div class="floor">
      <div
        class="line"
        :class="{ anim: lines, selfturn: yourTurn, enemy: !yourTurn }"
        @animationend="lines = false"
        v-for="line in 12"
        :key="line"
      ></div>
    </div>
    <div
      class="coin"
      :style="{ transform: `rotateX(${winner})` }"
      @animationend="flip = false"
      @click="start"
      :class="{ anim: flip }"
      ref="coin"
    >
      <div class="edge">
        <div class="segment" v-for="line in 16" :key="line"></div>
      </div>
    </div>
  </div>
</template>
<script>
export default {
  props: ["yourTurn"],
  data() {
    return {
      flip: false,
      lines: false,
      turn: 900,
    };
  },
  computed: {
    winner() {
      return this.yourTurn ? "720deg" : "900deg";
    },
  },
  methods: {
    start() {
      this.flip = true;
      this.lines = true;
      document.querySelector(":root").style.setProperty("--flips", this.winner);
    },
  },
  watch: {
    yourTurn() {
      this.start();
    },
  },
  //   mounted() {
  //     this.$refs.coin.addEventListener("animationend", () => (this.flip = false));
  //   },
};
</script>
<style lang="scss">
@import url("https://fonts.googleapis.com/css?family=Raleway:900");

$coin: #f7941e;
$bg: #3e3b3b;
$time: 1s;
$coin-size: 100px;
$coin-thicc: 7;

:root {
  --flips: 540deg;
}

*,
*:before,
*:after {
  box-sizing: border-box;
}

.coin {
  height: $coin-size;
  width: $coin-size;
  transform-style: preserve-3d;
  transform-origin: 50%;
  cursor: grab;

  &.anim {
    animation: flip $time linear forwards;
  }

  &:before,
  &:after {
    display: grid;
    place-items: center;
    position: absolute;
    height: 100%;
    width: 100%;
    border-radius: 50%;
    background: $coin;
    border: $coin-size * 0.08 solid lighten($coin, 5);
    box-shadow: inset 0 0 0 $coin-size * 0.02 darken($coin, 5);
    font-size: $coin-size * 0.2;
    font-family: "Raleway", sans-serif;
    text-align: center;
    color: darken($coin, 8);
    text-shadow: $coin-size * 0.01 $coin-size * 0.01 0 darken($coin, 15),
      -1 * ($coin-size * 0.01) -1 * ($coin-size * 0.01) 0 lighten($coin, 15);
  }

  &:before {
    transform: translateZ($coin-size/$coin-thicc/2);
    content: "your turn";
  }
  &:after {
    transform: translateZ(-$coin-size/$coin-thicc/2) rotateY(180deg)
      rotateZ(180deg);
    content: "enemy turn";
  }

  .edge {
    transform: translateX($coin-size/2-$coin-size/$coin-thicc/2);
    transform-style: preserve-3d;
    backface-visibility: hidden;

    .segment {
      height: $coin-size;
      width: $coin-size/$coin-thicc;
      position: absolute;
      transform-style: preserve-3d;
      backface-visibility: hidden;

      &:before,
      &:after {
        content: "";
        display: block;
        height: $coin-size/10;
        width: $coin-size/$coin-thicc;
        position: absolute;
        transform: rotateX(84.375deg);
      }

      $e1: darken($coin, 5);
      $e2: darken($coin, 10);

      &:before {
        transform-origin: top center;
        background: repeating-linear-gradient($e1 0, $e1 25%, $e2 25%, $e2 50%);
      }
      &:after {
        bottom: 0;
        transform-origin: center bottom;
        background: repeating-linear-gradient($e2 0, $e2 25%, $e1 25%, $e1 50%);
      }

      @for $i from 1 through 16 {
        &:nth-child(#{$i}) {
          transform: rotateY(90deg) rotateX($i * 11.25deg);
        }
      }
    }
  }
}
.shadow {
  animation: shadow $time ease-in-out forwards;
}
.floor {
  position: absolute;
  width: $coin-size;
  height: $coin-size;

  .line {
    position: absolute;
    top: 50%;
    left: 50%;
    margin-top: -$coin-size/$coin-thicc/8;
    width: $coin-size;
    height: $coin-size/$coin-thicc/4;
    transform-origin: center left;
    border-radius: $coin-size/$coin-thicc/4;
    background: linear-gradient(90deg, white 20%, transparent 20%);
    background-repeat: no-repeat;
    opacity: 0;
    &.anim {
      animation: lines $time * 0.6 ease-out forwards;
      animation-delay: 0.65s;
    }
    @for $i from 1 through 12 {
      &:nth-child(#{$i}) {
        @if $i % 2 == 0 {
          transform: rotate($i * 30deg);
        } @else {
          transform: rotate($i * 30deg) scale(1.1);
        }
      }
    }
  }
}

@keyframes flip {
  0% {
    transform: rotateY(0) rotateX(0deg) scale(1);
  }
  10% {
    transform: rotateY(45deg) rotateX(calc(var(--flips) / 3)) scale(1.6);
  }
  60% {
    transform: rotateY(-30deg) rotateX(calc(var(--flips) / 1.5)) scale(1.3);
  }
  100% {
    transform: rotateY(0) rotateX(var(--flips)) scale(1);
  }
}

@keyframes lines {
  40% {
    opacity: 1;
    background-position: -$coin-size * 0.8 0;
  }
  70% {
    opacity: 1;
    background-position: $coin-size * 0.5 0;
  }
  100% {
    opacity: 1;
    background-position: $coin-size * 1 0;
  }
}
@keyframes shadow {
  0% {
    box-shadow: auto;
  }
  60% {
    box-shadow: 1px 1px 49px rgba(0, 0, 0, 0.8);
    background: rgba(0, 0, 0, 0.3);
  }
  100% {
    box-shadow: auto;
  }
}
</style>
