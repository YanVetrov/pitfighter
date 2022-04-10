<template>
  <div class="main_view">
    <transition-group tag="div" class="main_view" mode="out-in" name="fade">
      <canvas
        v-show="socket.status === 'playing'"
        id="canvas1"
        key="0"
      ></canvas>
      <!-- <div class="waiting" v-show="socket.status === 'waiting'">
      SEARCHING FOR PLAYERS...
    </div> -->
      <ranger
        title="STAMINA"
        color="#ffaa00"
        :available="availableCost"
        :total="totalCost"
        v-if="availableCost !== null"
        key="23"
      />
      <ranger
        title="HP"
        color="#33ff99"
        style="left:0;right:auto"
        :available="health"
        v-if="health !== null"
        :total="strength"
        key="44"
      />
      <coin key="9" :yourTurn="whoTurn === socket.id" />
      <div
        class="waiting"
        :key="1"
        v-if="socket.status === 'waiting' && !choose"
      >
        <fireText message="searching for players..." />
      </div>
      <div key="101" class="room" v-show="roomId">
        ARENA ID: {{ roomId }} ver 0.0.2
      </div>
      <div
        key="202"
        class="time_turn"
        v-if="availableTime"
        style="display:flex;flex-direction:column;align-items:center;left:8px;"
      >
        <timer @timerUpdated="timeLeft = $event" :time="availableTime" />
        <div :style="{ height: timeLeft * 2 + '%' }" class="time_count"></div>
      </div>
      <button
        key="15"
        style="position:fixed;right:10px;top:10px;font-size:30px"
        @click="turnPass"
        v-if="whoTurn === socket.id"
      >
        PASS
      </button>

      <div key="440" class="characters" v-if="choose">
        <div>
          <div
            class="character_block"
            :style="{ background: `url(${require('./assets/card.png')})` }"
            v-for="(val, key) in units"
            :key="key"
          >
            <img :src="`./assets/${key}/${val.weapon}/idle/0.png`" />
            <div class="character_stats" style="margin:5px;">
              <div><img :src="`./assets/heart.svg`" /> {{ val.strength }}</div>
              <div><img :src="`./assets/speed.svg`" /> {{ val.speed }}</div>
              <div><img :src="`./assets/damage.svg`" /> {{ val.damage }}</div>
              <div>
                <img :src="`./assets/radius.svg`" /> {{ val.fire_radius }}
              </div>
              <div><img :src="`./assets/agility.svg`" /> {{ val.agility }}</div>
            </div>
            <div class="character_count" style="color:black">
              {{ val.count }}
            </div>
            <div class="character_name">{{ key }}</div>
            <div style="display:flex;width:100%;justify-content:space-around;">
              <button @click="val.count > 0 ? val.count-- : ''">-</button
              ><button
                @click="
                  Object.values(units)
                    .map(el => el.count)
                    .reduce((acc, el) => (acc += el), 0) < 6
                    ? val.count++
                    : ''
                "
              >
                +
              </button>
            </div>
          </div>
          <div style="position:fixed;bottom:50px;left:40%;">
            <input placeholder="nickname" v-model="nickname" />
            <button @click="onChoose">
              I'M READY
            </button>
          </div>
        </div>
      </div>
    </transition-group>
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
import fireText from "./components/fireText.vue";
import ranger from "./components/range.vue";
import axios from "axios";
import coin from "./components/coin.vue";
export default {
  components: { timer, fireText, ranger, coin },
  data() {
    return {
      socket: {},
      roomId: "",
      whoTurn: "",
      whoWait: "",
      availableTime: "",
      availableCost: null,
      totalCost: 9,
      health: null,
      nickname: "",
      strength: 1,
      fireMessage: "",
      choose: true,
      units: {},
      timeLeft: 0,
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
      console.log(target);
      if (store.gameScene.blockedUI) return console.log("blocked");
      if (!store.unit && target.unit && target.unit.owner === this.socket.id) {
        store.unit = target.unit;
        this.availableCost = store.unit.stamina;
        this.health = store.unit.health;
        this.strength = store.unit.strength;
      }
      if (store.unit && target.unit) {
        if (store.unit.owner !== target.unit.owner)
          return this.socket.emit("attack", {
            id: store.unit.id,
            target_id: target.unit.id,
            target_owner: target.unit.owner,
          });
        else {
          store.unit = target.unit;
          this.availableCost = store.unit.stamina;
          this.health = store.unit.health;
          this.strength = store.unit.strength;
        }
      }
      if (store.unit && !target.unit)
        return this.socket.emit("move_unit", {
          id: store.unit.id,
          x: target.posX,
          y: target.posY,
        });
    },
    async turnPass() {
      this.socket.emit("turn_pass");
    },
    async attackUnit({ id, target_id, hp, critical }) {
      console.log("attacked", id, target_id, hp, critical);
      let unit = store.gameScene.children.find(el => el.id === id);
      let target = store.gameScene.children.find(el => el.id === target_id);
      if (target === store.unit) this.health = hp;
      if (target.x > unit.x) unit.unit.scale.x = 1;
      else unit.unit.scale.x = -1;
      if (unit.unit.scale.x < 0) unit.unit.x = 360;
      else unit.unit.x = 1;
      let miss = target.health == hp;
      let damage = target.health - hp;
      target.health = hp;
      target.alphaCounter(`-${damage}`, 0xff3333);
      if (critical) target.alphaCounter(`CRITICAL!`, 0xffff00, 0.3);
      if (miss) {
        target.alphaCounter(`MISS!`, 0xffffff, 0.3);
      }
      unit.unit._textures = unit.unit.attack;
      if (unit.weapon === "gun") {
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
      }
      unit.timeoutAnimation = setTimeout(() => {
        unit.unit._textures = unit.unit.idle;
        unit.blocked = false;
      }, 1000);
      if (!miss) {
        if (target.health <= 0) {
          if (target.unit === store.unit) store.unit = {};
          clearTimeout(target.timeoutAnimation);
          target.unit.loop = false;
          target.unit._textures = target.unit.die;
          if (target === store.unit) store.unit = null;
          target.unit.gotoAndPlay(0);
          target.ground.unit = null;
          target.ground = null;
          gsap.to(target, { alpha: 0.3, delay: 1 });
        } else {
          target.unit._textures = target.unit.hurt;
          target.timeoutAnimation = setTimeout(() => {
            target.unit._textures = target.unit.idle;
            unit.blocked = false;
          }, 1000);
        }
      }
    },
    onChoose() {
      let units = [];
      Object.keys(this.units).forEach(key => {
        for (let i = 0; i < this.units[key].count; i++) {
          units.push(key);
        }
      });
      this.socket.emit("choose", { units, nickname: this.nickname });
      this.choose = false;
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
      container.weapon = weapon;
      container.name = el.type;
      container.stam = el.stamina;
      container.strength = el.strength;
      soldier.idle = idle;
      soldier.attack = attack;
      soldier.run = run;
      soldier.die = die;
      soldier.hurt = hurt;
      soldier.animationSpeed = 0.35;
      soldier.hp = el.hp;
      setTimeout(() => soldier.play(), Math.random() * 1000);
      let ground = store.map[y][x];
      container.ground = ground;
      ground.unit = container;
      container.x = ground.x + 20;
      container.y = ground.y + 20;
      container.scale.x = 0.2;
      container.scale.y = 0.2;
      let reversed = el.name === "knight" || el.name === "goblin" ? -1 : 1;
      if (scaleX < 0) {
        soldier.scale.x = -1;
        soldier.x = 360;
      }
      soldier.anchor.x = 0.1;
      soldier.anchor.y = 0.1;
      let name = el.nickname || this.socket.id;
      let color = container.self ? 0x0033fa : 0xff0000;
      container.ownerText = new Text(`${name}`, {
        fill: color,
        fontFamily: "metalwar",
        fontSize: 90 - name.length * 2,
        stroke: "#000",
        strokeThickness: 5,
      });
      container.ownerText.y = -130;
      container.ownerText.x = 30;
      container.addChild(container.ownerText);
      container.alphaCounter = async function(
        text = "+1",
        color = 0xeeeeee,
        delay = 0
      ) {
        let options = {
          fill: color,
          fontFamily: "metalwar",
          fontSize: 95,
        };
        let node = new Text(text, options);
        node.zIndex = 12;
        this.addChild(node);
        node.x = 40;
        node.y = 40;
        await gsap.to(node, { y: 0, alpha: 0, duration: 2, delay });
        this.removeChild(node);
      };
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

      let staminaBar = new Container();
      staminaBar.scale.x = 4;
      staminaBar.scale.y = 4;
      staminaBar.x = 50;
      staminaBar.y = -30;
      container.addChild(staminaBar);
      staminaBar.zIndex = 3;
      let innerBar1 = new Graphics();
      innerBar1.beginFill(0x333);
      innerBar1.drawRoundedRect(0, 0, 100, 8, 30);
      innerBar1.endFill();
      staminaBar.addChild(innerBar1);

      let outerBar1 = new Graphics();
      outerBar1.beginFill(0xff9900);
      outerBar1.drawRoundedRect(0, 0, (el.stamina / 9) * 100, 8, 30);
      outerBar1.endFill();
      staminaBar.addChild(outerBar1);

      staminaBar.outer = outerBar1;
      container.staminaText = new Text(`${el.stamina}/${9}`, {
        fill: 0xefefef,
        fontSize: 10,
        stroke: "#454545",
        strokeThickness: 2,
      });
      staminaBar.addChild(container.staminaText);
      container.staminaText.x = 38;
      container.staminaText.y = -3;
      container.staminaBar = outerBar1;
      Object.defineProperty(container, "stamina", {
        get() {
          return this.stam;
        },
        async set(val) {
          if (val < 0) val = 0;
          let percent = (val / 9) * 100;
          this.staminaBar.width = (val / 9) * 100 || 1;
          this.stam = val;
          this.staminaText.text = `${val}/${9}`;
          await gsap.to(this.staminaText.scale, {
            x: 1.1,
            y: 1.1,
            duration: 0.1,
          });
          await gsap.to(this.staminaText.scale, { x: 1, y: 1, duration: 0.1 });
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
        let url = undefined;
        if (window.location.href.includes("localhost"))
          url = "ws://localhost:8080";
        const socket = io(url);
        socket.status = "waiting";
        vm.socket = socket;
        socket.on("start_game", data => {
          console.log(data);
          vm.socket.status = "playing";
          vm.roomId = data.roomId;
          console.log([...data.self, ...data.enemy].map(el => el.id));
          [...data.self, ...data.enemy].forEach(el => {
            let hero = vm.getUnit(el, el.x, el.y, el.x > 14 ? -0.2 : 0.2);
            store.gameScene.addChild(hero);
          });
        });
        socket.on("user_leaved", id => {
          console.log("leave");
          vm.removeUnit(id);
          vm.removeUnit(vm.socket.id);
          store.unit = null;
          vm.choose = true;
          vm.socket.status = "waiting";
          console.log("users removed");
        });
        socket.on("unit_moved", ({ id, x, y }) => vm.moveUnit({ id, x, y }));
        socket.on("update_stamina", ({ id, stamina }) => {
          let unit = store.gameScene.children.find(el => el.id === id);
          unit.stamina = stamina;
          if (unit === store.unit) vm.availableCost = stamina;
        });
        socket.on("attacked", ({ id, target_id, hp, critical }) =>
          vm.attackUnit({ id, target_id, hp, critical })
        );
        socket.on("poison_set", ({ x, y }) => {
          console.log("poison set", { x, y });
          let poison = Sprite.from("./assets/poison.png");
          poison.poison = true;
          let ground = store.map[y][x];
          poison.x = ground.x + 20;
          poison.y = ground.y + 20;
          poison.scale.x = 0.15;
          poison.scale.y = 0.15;
          store.gameScene.addChild(poison);
        });
        socket.on("poison_hit", ({ id, hp }) => {
          console.log("poison hit");
          let unit = store.gameScene.children.find(el => el.id === id);
          store.gameScene.removeChild(
            store.gameScene.children.find(el => el.poison)
          );
          unit.health = hp;
        });
        socket.on("turn_changed", ({ whoTurn, whoWait, availableTime }) => {
          console.log("turned");
          vm.fireMessage =
            vm.socket.id === whoTurn ? "Your turn" : "Enemy turn";
          let turnedUnits = store.gameScene.children.filter(
            el => el.owner === whoTurn
          );
          let waitUnits = store.gameScene.children.filter(
            el => el.owner === whoWait
          );
          turnedUnits.forEach(el => (el.unit.alpha = 1));
          waitUnits.forEach(el =>
            gsap.to(el.unit, { alpha: 0.7, duration: 0.5 })
          );
          [...turnedUnits, ...waitUnits].forEach(
            el => (el.stamina = vm.totalCost)
          );
          if (store.unit) vm.availableCost = vm.totalCost;
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
  async mounted() {
    store.vue = this;
    this.initPixi();
    let url = "";
    if (window.location.href.includes("localhost"))
      url = "http://localhost:8080";
    let r = await axios.post(url + "/units_templates");
    Object.values(r.data).forEach(el => (el.count = 0));
    this.units = r.data;
  },
};
</script>
<style scoped>
.turn {
  font-size: 35px;
  bottom: 10px;
  color: darkseagreen;
  display: block;
  position: fixed;
  left: 40%;
  text-shadow: 1px 1px 3px darkslategrey;
}
.characters {
  position: absolute;
  width: 100%;
  height: 100%;
  top: 0;
  z-index: 999;
  background: black;
}
.characters > div {
  width: 100%;
  height: 100%;
  top: 0;
  z-index: 999;
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  justify-content: center;
  padding: 20px 0;
  overflow-y: scroll;
}
.character_block {
  width: 200px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  color: black;
  margin: 20px;
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 8px;
  padding: 10px;
  background-repeat: no-repeat;
  background-size: cover;
}
.character_block > img {
  height: 110px;
}
.time_turn {
  display: block;
  position: fixed;
  font-size: 30px;
  top: 20px;
  left: 20px;
  text-shadow: 1px 1px 3px darkslategrey;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  /* padding: 15px; */
  border: 5px solid white;
  width: 100px;
  border-radius: 100%;
  height: 100px;
  box-shadow: inset 1px 1px 15px black;
  color: white;
}
.time_count {
  background: rgba(255, 255, 255, 0.4);
  position: absolute;
  width: 100%;
  z-index: -1;
  bottom: 0;
}
.time_turn span {
  animation: bubble 1s linear infinite alternate-reverse;
}
.room {
  position: fixed;
  top: 0;
  color: white;
  text-shadow: 1px 1px 3px darkslategrey;
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
.character_stats {
  font-size: 20px;
  border-radius: 5%;
  padding: 5px;
  width: 100%;
}
.character_stats div {
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1px solid rgba(0, 0, 0, 0.1);
  color: #333;
  margin: 5px;
}
.character_stats img {
  height: 30px;
}
@keyframes bubble {
  0% {
    transform: scale(1);
  }
  100% {
    transform: scale(1.05);
  }
}
</style>
