<template>
  <div class="main_view">
    <audio
      src="./assets/sounds/main_theme.mp3"
      style="position:absolute;top:-999px"
      autoplay
      ref="audio"
      loop
    ></audio>
    <transition-group tag="div" class="main_view" mode="out-in" name="fade">
      <canvas
        v-show="socket.status === 'playing'"
        id="canvas1"
        key="0"
      ></canvas>

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
        style="display:flex;flex-direction:column;align-items:center;left:8px;justify-content:flex-end"
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
      <bottomBar
        :activeUnit="activeUnit"
        :selfUnits="selfUnits"
        :totalCost="totalCost"
        class="units_bottom"
        :class="{ hide_bottom }"
        @select="
          teleportation($event);
          tap();
        "
        @switch="hide_bottom = !hide_bottom"
        key="12"
      />
      <div key="440" class="characters" v-if="choose">
        CHOOSEN:
        <div class="character_wrapper">
          <div
            v-for="(k, i) in choosen"
            :key="i"
            style="border: 1px solid rgba(255,255,255,0.2);
    padding: 5px;
    border-radius: 5px;
    font-size: 15px;"
          >
            <div>{{ k.name }}</div>
            <div>{{ k.weapon || "origin" }}</div>
            <div>{{ k.armor || "origin" }}</div>
            <div>{{ k.boots || "origin" }}</div>
          </div>
        </div>
        <div class="character_wrapper">
          <gameCard
            v-for="(val, key) in units"
            :strength="val.strength"
            :img="val.img.name"
            :name="val.type"
            :speed="val.speed"
            :defence_melee="val.defence_melee"
            :damage="val.damage"
            :fire_radius="val.fire_radius"
            :agility="val.agility"
            :calc_damage="calculatePlus(val, 'damage')"
            :calc_fire_radius="calculatePlus(val, 'fire_radius')"
            :calc_agility="calculatePlus(val, 'agility')"
            :calc_defence_melee="calculatePlus(val, 'defence_melee')"
            :calc_speed="calculatePlus(val, 'speed')"
            :calc_strength="calculatePlus(val, 'strength')"
            :activeWeapon="val.weap"
            :activeArmor="val.armor"
            :activeBoots="val.boots"
            :weapons="
              Object.keys(items).filter(
                el =>
                  items[el].type === 'weapon' &&
                  val.range === items[el].available
              )
            "
            :armors="Object.keys(items).filter(el => items[el].part === 'body')"
            :boots="Object.keys(items).filter(el => items[el].part === 'boots')"
            @weapon="val.weap = $event"
            @armor="val.armor = $event"
            @boots="val.boots = $event"
            @choose="
              choosen.length < 6
                ? choosen.push({
                    name: val.type,
                    weapon: val.weap,
                    armor: val.armor,
                    boots: val.boots,
                  })
                  ? tap()
                  : tap()
                : ''
            "
            :key="key"
          />
        </div>
        <div
          style="
    display: flex;
    flex-direction: column;
    align-items: center;"
        >
          <input placeholder="nickname" v-model="nickname" />
          <button
            @click="
              onChoose();
              tap();
            "
          >
            I'M READY
          </button>
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
  Loader,
  Rectangle,
  SCALE_MODES,
  utils,
} from "pixi.js";
import { Spine } from "pixi-spine";
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
import { sound } from "@pixi/sound";
import bottomBar from "./components/bottom_bar.vue";
import gameCard from "./components/gameCard.vue";
for (let i = 0; i < 4; i++) {
  sound.add("shot_" + i, "./assets/sounds/battle/shots/_" + i + ".wav");
}
for (let i = 0; i < 10; i++) {
  sound.add("sword_" + i, "./assets/sounds/battle/sword/_" + i + ".mp3");
}
sound.add({
  click: "./assets/sounds/click.wav",
  move: "./assets/sounds/move.mp3",
  flip: "./assets/sounds/coin_flip.mp3",
  switch_on: "./assets/sounds/switch_on.wav",
  switch_off: "./assets/sounds/switch_off.wav",
  critical: "./assets/sounds/critical.wav",
});
export default {
  components: { timer, fireText, ranger, coin, bottomBar, gameCard },
  data() {
    return {
      socket: {},
      selfUnits: [],
      items: {},
      roomId: "",
      hide_bottom: false,
      whoTurn: "",
      whoWait: "",
      availableTime: "",
      availableCost: 9,
      totalCost: 9,
      health: null,
      nickname: "",
      strength: 1,
      fireMessage: "",
      choose: true,
      units: {},
      choosen: [],
      timeLeft: 0,
    };
  },
  computed: {
    activeUnit() {
      return this.selfUnits.find(el => el.active);
    },
  },
  methods: {
    tap() {
      sound.play("click");
    },
    calculatePlus(unit, key) {
      let val = [unit.weap, unit.armor, unit.boots]
        .filter(el => el)
        .map(el => this.items[el].stats[key])
        .filter(el => el)
        .map(el =>
          typeof el === "number"
            ? el
            : Math.round(unit[key] * (Number(el) / 100))
        )
        .reduce((a, b) => a + b, 0);
      return val > 0 ? `+${val}` : val;
    },
    async teleportation({ x, y, id }) {
      gsap.to(store.gameScene, {
        duration: 0.5,
        x: -x * (170 * store.gameScene.scale.x) + window.innerWidth / 3.5,
        y: -y * (139 * store.gameScene.scale.y) + window.innerHeight / 5,
      });
      if (id) {
        let unit = store.gameScene.children.find(el => el.id === id);
        if (unit) store.unit = unit;
        console.log(this.activeUnit);
      }
    },
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
      if (y % 2 === 0) multiplier = 84;
      target.x = x * 168 + multiplier;
      target.y = y * 138;
      target.interactive = true;
      target.buttonMode = true;
      store.gameScene.addChild(target);
      if (target.unclickable) return 0;
      target.on("pointerover", e => {
        target.alpha = 0.9;
      });
      target.on("pointerout", e => {
        target.alpha = 1;
      });
      target.on("pointerup", e => this.clickSprite(target, event));
      target.hitArea = new Polygon([
        0,
        50,

        0,
        140,

        86,
        186,

        170,
        140,

        170,
        50,

        86,
        0,
      ]);
    },
    async clickSprite(target, event) {
      console.log(target);
      console.log(utils.TextureCache);
      if (store.gameScene.blockedUI) return console.log("blocked");
      sound.play("click");
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
      let selfUnit = this.selfUnits.find(el => el.id === target_id);
      if (selfUnit) selfUnit.hp = hp;
      if (unit.range === "ranged") {
        let random = Math.ceil(Math.random() * 4 - 1);
        sound.play("shot_" + random);
      } else {
        let random = Math.ceil(Math.random() * 10 - 1);
        sound.play("sword_" + random);
      }
      if (critical) sound.play("critical");
      let random = Math.ceil(Math.random() * 3 - 1);
      let hit = this.createAnimatedSprite(
        `./assets/hits/${random}.png`,
        128,
        128,
        16,
        4
      ).sprite;
      target.addChild(hit);
      hit.animationSpeed = 0.5;
      hit.loop = false;
      hit.scale.x = 3;
      hit.scale.y = 3;
      hit.onComplete = () => {
        target.removeChild(hit);
      };
      hit.play();
      if (Math.random() > 0.6) {
        let blood = this.createAnimatedSprite(
          "./assets/blood.png",
          128,
          128,
          8,
          4
        ).sprite;
        store.gameScene.addChild(blood);
        let mult = 1;
        if (Math.random() > 0.5) mult = -1;
        blood.x = target.x + Math.random() * 100 * mult;
        blood.y = target.y + Math.random() * 100 * mult;
        blood.animationSpeed = 1;
        blood.loop = false;
        blood.play();
        let scaled = Math.random() * 0.5;
        blood.scale.x = 0.5 + scaled;
        blood.scale.y = 0.5 + scaled;
      }
      if (target.x > unit.x) unit.unit.scale.x = 1.5;
      else unit.unit.scale.x = -1.5;
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
      unit.unit.loop = false;
      unit.unit.gotoAndPlay(0);
      unit.unit.onComplete = () => {
        unit.unit._textures = unit.unit.idle;
        unit.unit.loop = true;
        unit.unit.gotoAndPlay(0);
      };

      if (unit.weapon === "gun") {
        let bullet = Sprite.from("./assets/bullet.png");
        store.gameScene.addChild(bullet);
        bullet.x = unit.x;
        bullet.y = unit.y;
        bullet.scale.x = 0.2;
        bullet.scale.y = 0.2;
        gsap.to(bullet, {
          x: target.x,
          y: target.y,
          alpha: 0.5,
          duration: 0.3,
          onComplete: () => {
            store.gameScene.removeChild(bullet);
          },
        });
      }
      // unit.timeoutAnimation = setTimeout(() => {
      //   unit.unit._textures = unit.unit.idle;
      //   unit.blocked = false;
      // }, 1000);
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
          target.unit.onComplete = () => console.log("dead");
          gsap.to(target, { alpha: 0.3, delay: 1 });
        } else {
          target.unit._textures = target.unit.hurt;
          target.unit.gotoAndPlay(0);
          target.unit.loop = false;
          target.unit.onComplete = () => {
            target.unit._textures = target.unit.idle;
            target.unit.loop = true;
            target.unit.gotoAndPlay(0);
            unit.blocked = false;
          };
        }
      }
    },
    createAnimatedSprite(src, width, height, count, inLine) {
      console.log(src, width, height, count, inLine);
      let texture = utils.TextureCache[src];
      texture.baseTexture.scaleMode = SCALE_MODES.NEAREST;
      let textures = [];
      for (let i = 0; i < count; i++) {
        texture.frame = new Rectangle(
          (i % inLine) * width,
          Math.floor(i / inLine) * height,
          width,
          height
        );
        textures.push(new Texture(texture.baseTexture, texture.frame));
      }
      let sprite = new AnimatedSprite(textures);
      return { sprite, textures };
    },
    onChoose() {
      this.socket.emit("choose", {
        units: this.choosen,
        nickname: this.nickname,
      });
      this.choose = false;
    },
    sound() {
      return sound;
    },
    async moveUnit({ id, x, y }) {
      sound.play("move", { volume: 0.2 });
      let unit = store.gameScene.children.find(el => el.id === id);
      let target = store.gameScene.children.find(
        el => el.posX === x && el.posY === y
      );
      let selfUnit = this.selfUnits.find(el => el.id === id);
      if (selfUnit) {
        selfUnit.x = x;
        selfUnit.y = y;
      }

      unit.unit._textures = unit.unit.run;
      if (target.x > unit.x) unit.unit.scale.x = 1.5;
      else unit.unit.scale.x = -1.5;
      if (unit.unit.scale.x < 0) unit.unit.x = 360;
      else unit.unit.x = 1;

      unit.ground.tint = 0xffffff;
      unit.ground.unit = null;
      target.tint = 0x99ff99;
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
      let textures = ["idle", "run", "attack", "death", "hurt"].reduce(
        (acc, el) => {
          acc[el] = this.createAnimatedSprite.apply(this, [
            `./assets/characters/${el.img.name}/${el}.png`,
            ...el.img.idle,
          ]).textures;
          return acc;
        },
        {}
      );

      let soldier = new AnimatedSprite(textures.idle);
      let container = new Container();
      container.addChild(soldier);
      container.unit = soldier;
      container.id = el.id;
      container.owner = el.owner;
      container.self = el.owner === this.socket.id;
      container.weapon = weapon;
      container.name = el.type;
      container.stam = el.stamina;
      container.range = el.range;
      container.strength = el.strength;
      container.zIndex = el.y + el.x;
      soldier.idle = textures.idle;
      soldier.attack = textures.attack;
      soldier.run = textures.run;
      soldier.die = textures.death;
      soldier.hurt = textures.hurt;
      soldier.animationSpeed = 0.2;
      soldier.hp = el.hp;
      setTimeout(() => soldier.play(), Math.random() * 1000);
      let ground = store.map[y][x];
      container.ground = ground;
      ground.unit = container;
      container.zIndex = el.y + el.x;
      container.x = ground.x;
      container.y = ground.y;
      container.scale.x = 0.35;
      container.scale.y = 0.35;
      let reversed = el.name === "knight" || el.name === "goblin" ? -1 : 1;
      soldier.scale.x = 1.5;
      soldier.scale.y = 1.5;
      if (scaleX < 0) {
        soldier.scale.x = -1.5;
        soldier.x = 360;
      }
      soldier.anchor.x = 0.4;
      soldier.anchor.y = 0.35;
      let name = el.nickname || this.socket.id;
      let color = container.self ? 0x0033fa : 0xff0000;
      container.ownerText = new Text(`${name}`, {
        fill: color,
        fontFamily: "metalwar",
        fontSize: 70 - name.length * 2,
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
          fontSize: 195,
        };
        let node = new Text(text, options);
        node.zIndex = 12;
        this.addChild(node);
        node.x = 40;
        node.y = -200;
        await gsap.to(node, { y: -250, alpha: 0, duration: 3, delay });
        this.removeChild(node);
      };
      let healthBar = new Container();
      healthBar.scale.x = 4;
      healthBar.scale.y = 4;
      healthBar.x = 50;
      healthBar.y = 20;
      // container.addChild(healthBar);
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
      // container.addChild(staminaBar);
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
      window.addEventListener("click", () => {
        this.$refs.audio.play();
      });
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
        store.gameScene.children
          .filter(el => el.tileMap)
          .forEach(el => {
            if (el.posX < 5 || el.posY < 5 || el.posX > 25 || el.posY > 25) {
              let random = Math.ceil(Math.random() * 7 - 1);
              let tree = Sprite.from(`./assets/trees/${random}.png`);
              tree.width = 300;
              tree.height = 300;
              el.nonPlayable = true;
              tree.x = el.x;
              tree.y = el.y;
              store.gameScene.addChild(tree);
              if (Math.random() > 0.75) {
                let textures = [];
                for (let x = 0; x < 25; x++) {
                  textures.push(Texture.from(`./assets/fires/${x}.png`));
                }
                let fire = new AnimatedSprite(textures);
                fire.animationSpeed = 0.3;
                let r = Math.random() * 4;
                fire.scale.x = r;
                fire.scale.y = r;
                fire.x = el.x + Math.random() * 5;
                fire.y = el.y + Math.random() * 5;
                fire.play();
                store.gameScene.addChild(fire);
              }
            } else {
              if (Math.random() > 0.9) {
                let random = Math.ceil(Math.random() * 50 - 1);
                let stuff = Sprite.from(`./assets/stuff/_${random}.png`);
                stuff.texture.baseTexture.on("loaded", () => {
                  stuff.x = el.x + 85 - stuff.width / 2;
                  stuff.y = el.y + 93 - stuff.height / 2;
                  store.gameScene.addChild(stuff);
                });
              }
            }
          });
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

        // app.loader
        //   .add("pirate", "./assets/pirate/Pirate.json")
        //   .add("shark", "./assets/shark/Shark.json")
        //   .load(function(loader, resources) {
        //     const pirate = new Spine(resources.pirate.spineData);
        //     const shark = new Spine(resources.shark.spineData);

        //     // add the animation to the scene and render...
        //     store.gameScene.addChild(pirate);
        //     shark.x = 800;
        //     store.gameScene.addChild(shark);
        //     [shark, pirate].forEach(el => {
        //       el.interactive = true;
        //       if (el.state.hasAnimation("Idle"))
        //         el.state.setAnimation(0, "Idle", true);
        //       else el.state.setAnimation(0, "Walk", true);
        //       el.on("pointerdown", () => {
        //         el.state.setAnimation(0, "Attack_1", false);
        //         if (el.state.hasAnimation("Idle"))
        //           el.state.addAnimation(0, "Idle", true, 0);
        //         else el.state.addAnimation(0, "Walk", true, 0);
        //       });
        //     });
        //   });

        let url = undefined;
        if (window.location.href.includes("localhost"))
          url = "ws://localhost:8080";
        const socket = io(url);
        socket.status = "waiting";
        vm.socket = socket;
        socket.on("start_game", data => {
          gsap.to(vm.$refs.audio, { volume: 0.15, duration: 0.5 });
          vm.socket.status = "playing";
          vm.roomId = data.roomId;
          data.self.forEach(el => (el.active = false));
          vm.selfUnits = data.self;
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
          sound.play("flip");
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
  watch: {
    hide_bottom() {
      if (this.hide_bottom) sound.play("switch_off");
      else sound.play("switch_on");
    },
  },
  async mounted() {
    store.vue = this;
    this.initPixi();
    let url = "";
    if (window.location.href.includes("localhost"))
      url = "http://localhost:8080";
    let r = await axios.post(url + "/units_templates");
    Object.values(r.data.units).forEach(el => {
      el.weap = "";
      el.active = false;
      (el.armor = ""), (el.boots = "");
    });
    let loader = new Loader();
    store.loader = loader;
    loader
      .add("./assets/hits/0.png")
      .add("./assets/hits/1.png")
      .add("./assets/hits/2.png")
      .add("./assets/blood.png")
      .add([
        ...Object.values(r.data.units).reduce((acc, unit) => {
          if (!unit.img) return acc;
          ["idle", "attack", "hurt", "run", "death"].forEach(key => {
            acc.push(`./assets/characters/${unit.img.name}/${key}.png`);
          });
          return acc;
        }, []),
      ])
      .load(() => console.log("loaded"));
    this.units = r.data.units;
    this.items = r.data.items;
  },
};
</script>
<style>
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
  overflow-y: scroll;
  color: white;
  text-align: center;
}
.item {
  font-size: 10px;
  display: flex;
  align-items: center;
  justify-content: flex-start;
  width: 100%;
}
.characters > .character_wrapper {
  top: 0;
  z-index: 999;
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  justify-content: center;
  padding: 20px 0;
}
.character_block {
  width: 200px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  color: black;
  margin: 20px;
  background: linear-gradient(-21deg, transparent 27%, white);
  border: 5px solid orange;
  border-radius: 8px;
  padding: 5px;
  position: relative;
  font-size: 15px;
}
.character_block > img {
  height: 146px;
  position: absolute;
  z-index: -1;
  opacity: 0.5;
}
.character_name {
  color: aliceblue;
}
.time_turn {
  display: block;
  position: fixed;
  font-size: 25px;
  top: 20px;
  left: 20px;
  text-shadow: 1px 1px 3px darkslategrey;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  /* padding: 15px; */
  width: 100px;
  border-radius: 100%;
  height: 100px;
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
  width: 100%;
  display: flex;
  justify-content: space-around;
}
.character_stats div {
  display: flex;
  align-items: center;
  justify-content: flex-start;
  color: #333;
  flex-direction: column;
  margin: 2px;
  font-size: 10px;
}
.character_stats div span {
  font-family: monospace;
}
.character_stats img {
  height: 15px;
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
