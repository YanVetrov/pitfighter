<template>
  <div class="main_view">
    <transition name="fade">
      <canvas id="canvas1"></canvas>
    </transition>
    <div class="waiting" v-show="socket.status === 'waiting'">
      SEARCHING FOR PLAYERS...
    </div>
    <div class="room" v-show="roomId">ARENA ID: {{ roomId }}</div>
    <div class="time_turn" v-if="availableTime">
      NEXT TURN IN: <timer :time="availableTime" />
    </div>
    <div class="time_turn" v-else>WAITING FOR READY ALL PLAYERS</div>
  </div>
</template>

<script>
import {
  Application,
  Sprite,
  Container,
  Polygon,
  Graphics,
  Text,
  AnimatedSprite,
  Texture,
} from "pixi.js";
import {
  initMap,
  sortUnit,
  enableInteractiveMap,
  getMontain,
  isAvailableMove,
  isAvailableAttack,
} from "./functionality";
import { ColorOverlayFilter } from "@pixi/filter-color-overlay";
import { BevelFilter } from "@pixi/filter-bevel";
import { store } from "./store";
import { gsap } from "gsap";
import { initGsap } from "./utils";
import { ColorMatrixFilter } from "@pixi/filter-color-matrix";
import { io } from "socket.io-client";
import timer from "./components/timer.vue";
export default {
  components: { timer },
  data() {
    return {
      socket: {},
      roomId: "",
      whoTurn: "",
      whoWait: "",
      availableTime: "",
    };
  },
  methods: {
    getTime(num) {
      let d = new Date(num);
      let h = d.getHours();
      let m = d.getMinutes();
      let s = d.getSeconds();
      let str = [h, m, s].map(el => (el < 10 ? "0" + el : el)).join(":");
      return str;
    },
    async renderMap() {
      store.visibleZone.forEach(el => store.gameScene.removeChild(el));
      store.gameScene.children.forEach(el => store.gameScene.removeChild(el));
      store.visibleZone = [];
      let y = store.y;
      let x = store.x;
      let endLines = store.y + store.countLines;
      if (y < 0) y = 0;
      if (x < 0) x = 0;
      let lines = store.map.slice(y, endLines);
      if (store.y < y || endLines > store.map.length - 1) {
        let count = Math.abs(y - store.y);
        // if (count === 0) count = Math.abs(endLines - store.map.length - 1);
        if (count < -5) count = -5;
        for (let i = 0; i < count; i++) {
          let newLine = [];
          for (let k = 0; k < store.cellsInLine; k++) {
            newLine.push(
              getMontain(top_bottom.frames, store.mountains_tb, store.id)
            );
          }
          if (store.y < 0) lines.unshift(newLine);
          else lines.push(newLine);
        }
      }
      lines.forEach((el, i) => {
        let count = 0;
        let line = [...el];
        let endLine = store.x + store.cellsInLine;
        if (store.x < x) count = Math.abs(x - store.x);
        line = line.slice(x, endLine);
        if (line.length < store.cellsInLine)
          count = Math.abs(store.cellsInLine - line.length);

        for (let i = 0; i < count; i++) {
          // if (store.x < x)
          //   line.unshift(
          //     getMontain(right_left.frames, store.mountains_rl, store.id)
          //   );
          // else
          //   line.push(
          //     getMontain(right_left.frames, store.mountains_rl, store.id)
          //   );
        }
        line.forEach(cell => store.visibleZone.push(cell));
      });
      let date = Date.now();
      console.log("map ready " + (Date.now() - date));
      console.log("map rendered " + (Date.now() - date));
      store.gameScene.children.forEach(el => store.gameScene.removeChild(el));
      store.gameScene.children.forEach(el => store.gameScene.removeChild(el));
      store.gameScene.children.forEach(el => store.gameScene.removeChild(el));
      store.gameScene.children.forEach(el => store.gameScene.removeChild(el));
      store.gameScene.children.forEach(el => store.gameScene.removeChild(el));
      store.gameScene.children.forEach(el => store.gameScene.removeChild(el));
      store.gameScene.children.forEach(el => store.gameScene.removeChild(el));
      store.visibleZone.forEach((el, i) => this.addSprite(el, i));
      store.unitsInVisibleZone.forEach(el =>
        sortUnit(el, store.unit, store.visibleZone, store.gameScene)
      ),
        console.log("units sorted " + (Date.now() - date));
      store.objectsOnMap.forEach(el =>
        sortUnit(el, store.unit, store.visibleZone, store.gameScene)
      );
      console.log("obj sorted " + (Date.now() - date));
      // initMiniMap();
      // renderMiniMap();
    },
    addSprite(target, i) {
      i++;
      let y = Math.ceil(i / store.cellsInLine);
      let x = i % store.cellsInLine;
      let multiplier = 0;
      if (y % 2 === 0) multiplier = 60;
      target.x = x * 120 + multiplier;
      target.y = y * 103;
      target.interactive = true;
      target.buttonMode = true;
      store.gameScene.addChild(target);
      if (target.unclickable) return 0;
      target.on("pointerover", e => {
        let filter = new BevelFilter({
          lightColor: 0xaaffaa,
          thickness: 4,
          rotation: 0,
          shadowColor: 0xaaffaa,
          lightAlpha: 0.8,
          shadowAlpha: 0.8,
        });
        filter.hover = true;
        target.filters = [filter];
      });
      target.on("pointerout", e => {
        target.alpha = 1;
        if (store.unit !== target.unit)
          target.filters = target.filters.filter(el => !el.hover);
        if (target.unit) {
          target.unit.filters = [];
          if (target.unit.unit) target.unit.unit.filters = [];
        }
      });
      target.on("pointerup", e => this.clickSprite(target, event));
      target.hitArea = new Polygon([
        0,
        46,

        0,
        92,

        60,
        140,

        120,
        92,

        120,
        46,

        60,
        0,
      ]);
    },
    async clickSprite(target, event) {
      if (!store.unit && target.unit && target.unit.owner === this.socket.id)
        store.unit = target.unit;
      if (store.unit && target.unit) {
        if (store.unit.owner !== target.unit.owner)
          return this.socket.emit("attack", {
            id: store.unit.id,
            target_id: target.unit.id,
            target_owner: target.unit.owner,
          });
        else store.unit = target.unit;
      }
      if (store.unit && !target.unit)
        return this.socket.emit("move_unit", {
          id: store.unit.id,
          x: target.posX,
          y: target.posY,
        });
    },
    async attackUnit({ id, target_id, hp }) {
      console.log("attacked", id, target_id, hp);
      let unit = store.gameScene.children.find(el => el.id === id);
      let target = store.gameScene.children.find(el => el.id === target_id);
      if (unit.blocked || target.blocked) return 0;
      if (target.health <= 0) return 0;
      unit.blocked = true;
      if (target.x > unit.x) unit.unit.scale.x = 1;
      else unit.unit.scale.x = -1;
      if (unit.unit.scale.x < 0) unit.unit.x = 360;
      else unit.unit.x = 1;
      target.health = hp;
      unit.unit._textures = unit.unit.attack;
      let bullet = Sprite.from("./assets/Bullet.png");
      store.gameScene.addChild(bullet);
      bullet.x = unit.x;
      bullet.y = unit.y;
      bullet.scale.x = 0.2;
      bullet.scale.y = 0.2;
      gsap.to(bullet, {
        x: target.x,
        y: target.y,
        duration: 1,
        onComplete: () => {
          store.gameScene.removeChild(bullet);
        },
      });
      setTimeout(() => {
        unit.unit._textures = unit.unit.idle;
        unit.blocked = false;
      }, 1000);
      if (target.health <= 0) {
        if (target.unit === store.unit) store.unit = {};
        target.unit.loop = false;
        target.unit._textures = target.unit.die;
        target.unit.gotoAndPlay(0);
        target.ground.unit = null;
        target.ground = null;
      } else {
        target.unit._textures = target.unit.hurt;
        setTimeout(() => {
          target.unit._textures = target.unit.idle;
          unit.blocked = false;
        }, 1000);
      }
    },
    async moveUnit({ id, x, y }) {
      let unit = store.gameScene.children.find(el => el.id === id);
      let target = store.gameScene.children.find(
        el => el.posX === x && el.posY === y
      );
      unit.unit._textures = unit.unit.run;
      if (target.x > unit.x) unit.unit.scale.x = 1;
      else unit.unit.scale.x = -1;
      if (unit.unit.scale.x < 0) unit.unit.x = 360;
      else unit.unit.x = 1;

      unit.ground.filters = [];
      unit.ground.unit = null;
      target.filters = [
        new BevelFilter({
          lightColor: 0xaaffaa,
          thickness: 6,
          rotation: 0,
          shadowColor: 0xaaffaa,
          lightAlpha: 0.8,
          shadowAlpha: 0.8,
        }),
      ];
      unit.ground = target;
      target.unit = unit;
      await gsap.to(unit, {
        x: target.x + 20,
        y: target.y + 20,
        duration: 0.5,
      });
      unit.unit._textures = unit.unit.idle;
    },
    removeUnit(owner) {
      console.log(store.gameScene.children, owner);
      store.gameScene.children
        .filter(el => el.owner === owner)
        .forEach(el => store.gameScene.removeChild(el));
    },
    getUnit({ type, weapon, ...el }, x, y, scaleX = 0.2) {
      let count = [
        "1.png",
        "2.png",
        "3.png",
        "4.png",
        "5.png",
        "6.png",
        "7.png",
        "8.png",
        "9.png",
      ];
      let idle = count.map(el =>
        Texture.from(`./assets/${type}/${weapon}/idle/${el}`)
      );
      let attack = count.map(el =>
        Texture.from(`./assets/${type}/${weapon}/shot/${el}`)
      );
      let run = count.map(el =>
        Texture.from(`./assets/${type}/${weapon}/run/${el}`)
      );
      let die = count.map(el => Texture.from(`./assets/${type}/die/${el}`));
      let hurt = count.map(el =>
        Texture.from(`./assets/${type}/${weapon}/hurt/${el}`)
      );
      let soldier = new AnimatedSprite(idle);
      let container = new Container();
      container.addChild(soldier);
      container.unit = soldier;
      container.id = el.id;
      container.owner = el.owner;
      container.self = el.owner === this.socket.id;
      soldier.idle = idle;
      soldier.attack = attack;
      soldier.run = run;
      soldier.die = die;
      soldier.hurt = hurt;
      soldier.animationSpeed = 0.35;
      soldier.hp = 250;
      setTimeout(() => soldier.play(), Math.random() * 1000);
      let ground = store.map[y][x];
      container.ground = ground;
      ground.unit = container;
      container.x = ground.x + 20;
      container.y = ground.y + 20;
      container.scale.x = 0.2;
      container.scale.y = 0.2;
      if (scaleX < 0) {
        soldier.scale.x = -1;
        soldier.x = 360;
      }
      let color = container.self ? 0x00aaff : 0xff0000;
      container.ownerText = new Text(`${this.socket.id}`, {
        fill: color,
        fontFamily: "metalwar",
        fontSize: 45,
        stroke: "#000",
        strokeThickness: 2,
      });
      container.ownerText.y = -30;
      container.addChild(container.ownerText);
      let healthBar = new Container();
      healthBar.scale.x = 4;
      healthBar.scale.y = 4;
      healthBar.x = 50;
      healthBar.y = 20;
      container.addChild(healthBar);
      healthBar.zIndex = 3;
      let innerBar = new Graphics();
      innerBar.beginFill(0x333);
      innerBar.drawRoundedRect(0, 0, 100, 8, 30);
      innerBar.endFill();
      healthBar.addChild(innerBar);

      let outerBar = new Graphics();
      let percent = (el.hp / el.strength) * 100;
      outerBar.beginFill(percent < 30 ? 0x990000 : 0x009900);
      outerBar.drawRoundedRect(0, 0, (el.hp / el.strength) * 100, 8, 30);
      outerBar.endFill();
      healthBar.addChild(outerBar);

      healthBar.outer = outerBar;
      container.hpText = new Text(`${el.hp}/${el.strength}`, {
        fill: 0xefefef,
        fontSize: 10,
        stroke: "#454545",
        strokeThickness: 2,
      });
      healthBar.addChild(container.hpText);
      container.hpText.x = 30;
      container.hpText.y = -3;
      container.healthBar = outerBar;
      Object.defineProperty(container, "health", {
        get() {
          return this.unit.hp;
        },
        async set(val) {
          if (val < 0) val = 0;
          let color = 0x00ff00;
          let percent = (val / el.strength) * 100;
          if (percent <= 30) {
            color = 0xff9999;
          }
          this.healthBar.width = (val / el.strength) * 100 || 1;
          this.healthBar.tint = color;
          this.unit.hp = val;
          this.hpText.text = `${val}/${el.strength}`;
          await gsap.to(this.hpText.scale, { x: 1.1, y: 1.1, duration: 0.1 });
          await gsap.to(this.hpText.scale, { x: 1, y: 1, duration: 0.1 });
        },
      });
      return container;
    },
    initPixi() {
      const vm = this;
      initGsap();
      const app = new Application({
        width: window.innerWidth,
        height: window.innerHeight,
        // antialias: true,
        resolution: devicePixelRatio,
        autoDensity: true,
        view: document.getElementById("canvas1"),
      });

      store.gameScene = new Container();
      store.gameScene.sortableChildren = true;
      store.gameScene.zIndex = 2;
      store.gameScene.x = store.defaultPosX;
      store.gameScene.y = store.defaultPosY;
      store.gameScene.scale.y = 0.8;
      store.gameScene.scale.x = 0.8;
      app.stage.addChild(store.gameScene);
      app.stage.sortableChildren = true;
      app.renderer.backgroundColor = "0x202020";
      app.renderer.autoResize = true;
      setup();
      function setup() {
        store.map = initMap([], store.id, store.allMapCount);
        vm.renderMap();
        enableInteractiveMap(
          document.querySelector("canvas"),
          store.gameScene,
          vm.renderMap,
          vm
        );
        document.addEventListener(
          "contextmenu",
          e => {
            e.preventDefault();
            e.stopPropagation();
          },
          true
        );
        store.coordinates = new Text(``, {
          fontSize: 30,
          fontFamily: "metalwar",
          fill: 0xffffff,
        });
        store.coordinates.zIndex = 3;
        app.stage.addChild(store.coordinates);
        // document.getElementById("log").addEventListener("click", e => {
        //   console.log(store.logs);
        // });
        // document
        //   .getElementById("garage_button")
        //   .addEventListener("click", () => showGarage(false));
        // let soldier = vm.getUnit({ name: "sold", weapon: "gun" }, 8, 8);
        // store.gameScene.addChild(soldier);
        // let hero = vm.getUnit({ name: "hero", weapon: "gun" }, 10, 12);
        // store.gameScene.addChild(hero);
        // soldier = vm.getUnit({ name: "sold", weapon: "gun" }, 11, 9, -0.2);
        // store.gameScene.addChild(soldier);
        // hero = vm.getUnit({ name: "sold", weapon: "gun" }, 12, 6, 0.2);
        // store.gameScene.addChild(hero);
        const socket = io(`ws://${window.location.host}`);
        socket.status = "waiting";
        vm.socket = socket;
        socket.on("start_game", data => {
          console.log(data);
          vm.socket.status = "playing";
          vm.roomId = data.roomId;
          [...data.self, ...data.enemy].forEach(el => {
            let hero = vm.getUnit(el, el.x, el.y, el.x > 9 ? -0.2 : 0.2);
            store.gameScene.addChild(hero);
          });
        });
        socket.on("user_leaved", id => {
          console.log("leave");
          vm.removeUnit(id);
          vm.removeUnit(vm.socket.id);
          store.unit = null;
          vm.socket.status = "waiting";
          console.log("users removed");
        });
        socket.on("unit_moved", ({ id, x, y }) => vm.moveUnit({ id, x, y }));
        socket.on("attacked", ({ id, target_id, hp }) =>
          vm.attackUnit({ id, target_id, hp })
        );
        socket.on("turn_changed", ({ whoTurn, whoWait, availableTime }) => {
          console.log("turned");
          let turnedUnits = store.gameScene.children.filter(
            el => el.owner === whoTurn
          );
          let waitUnits = store.gameScene.children.filter(
            el => el.owner === whoWait
          );
          turnedUnits.forEach(el => (el.alpha = 1));
          waitUnits.forEach(el => (el.alpha = 0.5));
          vm.whoTurn = whoTurn;
          vm.whoWait = whoWait;
          vm.availableTime = availableTime;
        });
      }

      window.addEventListener("resize", e => {
        app.renderer.resize(window.innerWidth, window.innerHeight);
      });
      document.querySelector("canvas").addEventListener("contextmenu", e => {
        e.preventDefault();
      });
    },
  },
  mounted() {
    store.vue = this;
    this.initPixi();
  },
};
</script>
<style scoped>
.time_turn {
  display: block;
  position: absolute;
  top: 0;
  right: 0;
  color: brown;
}
.room {
  position: fixed;
  top: 0;
  color: white;
}
.waiting {
  z-index: 999;
  width: 100%;
  height: 100%;
  background: black;
  position: absolute;
  top: 0;
  color: white;
  display: flex;
  justify-content: center;
  align-items: center;
}
</style>
