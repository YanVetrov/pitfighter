<template>
  <div class="deck" ref="deck">
    <div
      class="card"
      v-for="(k, i) in cards"
      :key="i"
      ref="card"
      @click="flip(k.id)"
      v-touch:swipe.right="
        () => rotate(cards.reduce((acc, curr) => Math.max(acc, curr.id), 0))
      "
      :class="{ rotate_card: k.rotate, flip_card: k.flip }"
      :style="{
        zIndex: k.id,
        opacity: k.opacity,
        transition: 'all .3s ease',
        transform: `translate(${k.id * 10}px,${k.id * 10}px)`,
      }"
    >
      <img :src="require(`../assets/${k.img}.png`)" />
      <div
        style="background-image: url('../assets/back_card.webp')"
        class="card_info"
      >
        <div class="backstory">
          Backstore of character some information lorem ipsum etc.
        </div>
      </div>
    </div>
    <div
      class="arrow_right"
      @click="rotate(cards.reduce((acc, curr) => Math.max(acc, curr.id), 0))"
    >
      <img src="../assets/arrow_right.svg" />
    </div>
    <transition mode="out-in" name="fade">
      <div
        class="card_title fire"
        v-if="cards.every((k) => !k.flip)"
        :key="[...cards].sort((a, b) => b.id - a.id)[0].name"
      >
        {{ [...cards].sort((a, b) => b.id - a.id)[0].name }}
      </div>
    </transition>
  </div>
</template>
<script>
export default {
  data() {
    return {
      block: false,
      cards: [
        {
          id: 2,
          name: "knight rare",
          img: "card1",
          color: "#bfc",
          rotate: true,
          flip: false,
          opacity: 0,
        },
        {
          id: 3,
          name: "hobgoblin",
          img: "card2",
          color: "red",
          rotate: true,
          flip: false,
          opacity: 0,
        },
        {
          id: 4,
          name: "knight",
          img: "card3",
          color: "blue",
          rotate: true,
          flip: false,
          opacity: 0,
        },
        {
          id: 5,
          name: "shaman",
          img: "card4",
          color: "green",
          rotate: true,
          flip: false,
          opacity: 0,
        },
      ],
    };
  },
  methods: {
    rotate(id, flipped) {
      if (this.cards.some((el) => el.rotate)) return;
      this.cards.forEach((el) => (el.flip = false));
      let card = this.cards.find((card) => card.id === id);
      console.log(id);
      card.rotate = true;
      setTimeout(() => this.animationEnd(id), 200);
    },
    flip(id) {
      let card = this.cards.find((card) => card.id === id);
      if (!card.flip) card.flip = true;
      else {
        card.flip = false;
        this.rotate(id);
      }
    },
    animationEnd(id, e) {
      console.log("end");
      let card = this.cards.find((card) => card.id === id);
      console.log("ok");
      this.cards.forEach((card) => card.id++);
      card.id = 1;
      setTimeout(() => (card.rotate = false), 100);
    },
    checkRotate() {
      let count =
        this.$refs.deck.getBoundingClientRect().top - window.innerHeight / 2;
      if (count < 0) {
        window.removeEventListener("scroll", this.checkRotate);
        this.cards.forEach((el, i) =>
          setTimeout(() => {
            el.rotate = false;
            el.opacity = 1;
          }, i * 150)
        );
      }
    },
  },
  created() {
    window.addEventListener("scroll", this.checkRotate);
  },
};
</script>
<style lang="scss" scoped>
.rotate_card {
  transform: translate(250px, -350px) rotate(30deg) !important;
}
.flip_card {
  transform: scale(-1.5, 1.5) !important;
  z-index: 9 !important;
  box-shadow: -10px 10px 25px black;
  border-radius: 10px;
  overflow: hidden;
}

.card > img {
  transition: all 0.3s ease;
}
.flip_card > img {
  // filter: blur(2px);
}
.arrow_right {
}
.arrow_right img {
  width: 40px;
  position: absolute;
  right: 90px;
}
.card_info {
  position: absolute;
  top: 0;
  transform: scale(-1, 1);
  z-index: 2;
  left: 0;
  opacity: 0;
  width: 100%;
  height: 100%;
  background-repeat: no-repeat;
  background-size: contain;
  transition: all 0.3s ease;
}
.flip_card .card_info::after {
  position: absolute;
  content: "";
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.3);
  transition: all 0.4s ease;
  left: 0;
  top: 0;
}
.flip_card .card_info {
  opacity: 1;
}
.backstory {
  position: relative;
  top: 113px;
  font-size: 10px;
  padding: 0px 38px;
  text-align: center;
  line-height: 1.7;
  z-index: 3;
}
.card_title {
  position: absolute;
  bottom: 20px;
  font-size: 40px;
  color: black;
  margin-left: 100px;
}
</style>
