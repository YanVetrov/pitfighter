<template>
  <div class="deck">
    <div
      class="card"
      v-for="(k, i) in cards"
      :key="i"
      @click="flip(k.id)"
      v-touch:swipe.right="
        () => rotate(cards.reduce((acc, curr) => Math.max(acc, curr.id), 0))
      "
      :class="{ rotate_card: k.rotate, flip_card: k.flip }"
      :style="{
        zIndex: k.id,
        transition: 'all .3s ease',
        transform: `translate(${k.id * 10}px,${k.id * 10}px)`,
      }"
    >
      <img :src="require(`../assets/${k.img}.png`)" />
      <transition name="fade">
        <div v-if="k.flip" class="card_info">some info example</div>
      </transition>
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
        v-if="cards.every(k => !k.flip)"
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
          id: 1,
          name: "goblin",
          img: "card",
          color: "#abc",
          rotate: false,
          flip: false,
        },
        {
          id: 2,
          name: "knight",
          img: "card1",
          color: "#bfc",
          rotate: false,
          flip: false,
        },
        {
          id: 3,
          name: "margrave",
          img: "card2",
          color: "red",
          rotate: false,
          flip: false,
        },
        {
          id: 4,
          name: "smuggler",
          img: "card3",
          color: "blue",
          rotate: false,
          flip: false,
        },
        {
          id: 5,
          name: "hobgoblin",
          img: "card4",
          color: "green",
          rotate: false,
          flip: false,
        },
      ],
    };
  },
  computed: {},
  methods: {
    rotate(id, flipped) {
      if (this.cards.some(el => el.rotate)) return;
      let card = this.cards.find(card => card.id === id);
      console.log(id);
      card.rotate = true;
      setTimeout(() => this.animationEnd(id), 200);
    },
    flip(id) {
      let card = this.cards.find(card => card.id === id);
      if (!card.flip) card.flip = true;
      else {
        card.flip = false;
        this.rotate(id);
      }
    },
    animationEnd(id, e) {
      console.log("end");
      let card = this.cards.find(card => card.id === id);
      console.log("ok");
      this.cards.forEach(card => card.id++);
      card.id = 1;
      setTimeout(() => (card.rotate = false), 100);
    },
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
.flip_card::after {
  position: absolute;
  content: "";
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.8);
  transition: all 0.3s ease;
  left: 0;
}
.card > img {
  transition: all 0.3s ease;
}
.flip_card > img {
  filter: blur(2px);
}
.arrow_right {
}
.arrow_right img {
  width: 40px;
  position: absolute;
  right: 0;
}
.card_info {
  position: absolute;
  top: 30%;
  transform: scale(-1, 1);
  z-index: 2;
  left: 2%;
}
.card_title {
  position: absolute;
  bottom: 20px;
  font-size: 40px;
  color: black;
  margin-left: 100px;
}
</style>
