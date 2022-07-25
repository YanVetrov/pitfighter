<template>
  <div class="hello">
    <div @click="initializeGame" class="flex">
      <a href="#1" class="btn">Initialize</a>
    </div>
    <ion-phaser v-bind:game.prop="game" v-bind:initialize.prop="true" />
  </div>
</template>

<script>
import Phaser from "phaser";
export default {
  data() {
    return {
      initialize: true,
      game: {
        width: "100%",
        height: "100%",
        type: Phaser.AUTO,
        scene: {
          preload() {
            this.load.image("grass", "grass.png");
          },
          init() {
            this.cameras.main.setBackgroundColor("#24252A");
          },
          create() {
            this.helloWorld = this.add.text(
              this.cameras.main.centerX,
              this.cameras.main.centerY,
              "Hello World",
              { font: "40px Arial", fill: "#ffffff" }
            );
            this.helloWorld.setOrigin(0.5);
            this.add.image(100, 100, "grass");
          },
          update() {
            this.helloWorld.angle += 1;
          },
        },
      },
    };
  },
  methods: {
    initializeGame() {
      this.initialize = true;
    },
  },
};
</script>

<style>
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
  margin-top: 60px;
}
</style>
