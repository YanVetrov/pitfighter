<template>
  <div class="crate_main" ref="crates" @click="tapped">
    <img
      @animationend="shake = false"
      :class="{ shake }"
      :src="require(`../assets/${open ? openCrate : crate}.webp`)"
      class="crate_img"
    />
    <img src="../assets/shield.webp" class="shield" />
    <img
      @transitionend="keyEnd"
      src="../assets/key2.webp"
      class="key"
      :class="{ active_key: key }"
    />
  </div>
</template>
<script>
export default {
  props: ["crate", "openCrate", "openText", "preShake"],
  data() {
    return {
      open: false,
      shake: false,
      taped: false,
      key: false,
    };
  },
  methods: {
    tapped() {
      this.shake = true;
      this.taped = true;
      this.key = true;
    },
    animationEnd() {
      if (!this.taped) return (this.shake = false);
      this.shake = false;
      this.open = true;
      setTimeout(() => this.$emit("open"), 250);
    },
    checkRotate() {
      let count =
        this.$refs.crates.getBoundingClientRect().top - window.innerHeight / 2;
      if (count < 0) {
        window.removeEventListener("scroll", this.checkRotate);
        this.shake = true;
      }
    },
    keyEnd() {
      if ((this.key = false)) return 0;
      setTimeout(() => {
        this.key = false;
        this.animationEnd();
      }, 300);
    },
  },
  created() {
    if (this.preShake) window.addEventListener("scroll", this.checkRotate);
  },
};
</script>
<style lang="scss" scoped>
.active {
  opacity: 0;
}
.key {
  position: absolute;
  top: 19px;
  left: -46px;
  transform: rotate(180deg);
  z-index: 9;
  pointer-events: none;
  transition: all 0.5s ease-out;
  opacity: 0;
}
.active_key {
  opacity: 0.8;
  top: 35px;
  left: 20px;
  transform: scale(0.7) rotate(180deg) rotate3d(17, 22, 10, 58deg);
}
@media screen and (max-width: 830px) {
  .key {
    position: absolute;
    top: 19px;
    left: -100px;
    transition: all 0.4s ease-out;
  }
  .active_key {
    opacity: 0.8;
    top: 35px;
    left: 20px;
    transform: scale(1) rotate(180deg) rotate3d(17, 22, 10, 58deg);
  }
}
</style>
