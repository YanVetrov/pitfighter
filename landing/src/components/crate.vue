<template>
  <div class="crate_main" ref="crates" @click="tapped">
    <img
      :class="{ shake }"
      @animationend="animationEnd"
      :src="require(`../assets/${open ? openCrate : crate}.png`)"
      class="crate_img"
    />
    <img src="../assets/shield.png" class="shield" />
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
    };
  },
  methods: {
    tapped() {
      this.shake = true;
      this.taped = true;
    },
    animationEnd() {
      if (!this.taped) return (this.shake = false);
      this.shake = false;
      this.open = true;
      setTimeout(() => this.$emit("open"));
    },
    checkRotate() {
      let count =
        this.$refs.crates.getBoundingClientRect().top - window.innerHeight / 2;
      if (count < 0) {
        window.removeEventListener("scroll", this.checkRotate);
        this.shake = true;
      }
    },
  },
  created() {
    if (this.preShake) window.addEventListener("scroll", this.checkRotate);
  },
};
</script>
<style scoped></style>
