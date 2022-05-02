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
        ARENA ID: {{ roomId }},
        <span v-if="spectator">who turn: {{ whoTurn }}</span>
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
        v-if="!spectator"
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
        @activate_skill="
          tap();
          activate_skill($event);
        "
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
            :skills="[...val.passive_skills, ...val.active_skills]"
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
import { Application, Sprite, Container, Loader, utils } from "pixi.js";
import { Spine } from "pixi-spine";
import { initMap, enableInteractiveMap, renderMap } from "./map.js";
import { store } from "./store.js";
import { gsap } from "gsap";
import { initGsap, createAnimatedSprite } from "./utils";
import { io } from "socket.io-client";
import timer from "./components/timer.vue";
import fireText from "./components/fireText.vue";
import ranger from "./components/range.vue";
import axios from "axios";
import coin from "./components/coin.vue";
import { sound } from "@pixi/sound";
import bottomBar from "./components/bottom_bar.vue";
import gameCard from "./components/gameCard.vue";
import { getUnit } from "./unit.js";
import {
  turn_changed,
  poison_set,
  poison_hit,
  attacked,
  unit_moved,
  user_leaved,
  start_game,
  update_stamina,
  unit_changed,
} from "./socket.js";
for (let i = 0; i < 4; i++) {
  sound.add("shot_" + i, "./assets/sounds/battle/shots/_" + i + ".wav");
}
for (let i = 0; i < 10; i++) {
  sound.add("sword_" + i, "./assets/sounds/battle/sword/_" + i + ".mp3");
}
[
  "click.wav",
  "move.mp3",
  "coin_flip.mp3",
  "switch_on.wav",
  "switch_off.wav",
  "critical.wav",
].forEach(el => sound.add(el.split(".")[0], "./assets/sounds/" + el));

export default {
  components: { timer, fireText, ranger, coin, bottomBar, gameCard },
  data() {
    return {
      socket: {},
      selfUnits: [],
      items: {},
      roomId: "",
      spectator: false,
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
    activate_skill({ id, skill_id }) {
      console.log(id, skill_id);
      this.socket.emit("activate_skill", { id, skill_id });
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
    turnPass() {
      this.socket.emit("turn_pass");
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
        renderMap(store, vm.clickSprite);
        enableInteractiveMap(
          document.querySelector("canvas"),
          store.gameScene,
          () => renderMap(store, vm.clickSprite),
          vm
        );
        let url = undefined;
        if (window.location.href.includes("localhost"))
          url = "ws://localhost:8080";
        const socket = io(url);
        socket.status = "waiting";
        console.log(store.vue);
        vm.socket = socket;
        let hash = window.location.hash.slice(1);
        if (hash) {
          socket.emit("join", {
            roomId: hash,
          });
        }
        socket.on("start_game", data => {
          gsap.to(vm.$refs.audio, { volume: 0.15, duration: 0.5 });
          vm.socket.status = "playing";
          vm.roomId = data.roomId;
          vm.spectator = data.spectator;
          history.pushState(null, null, `#${data.roomId}`);
          data.self.forEach(el => {
            el.self = true;
            el.active = false;
          });
          vm.selfUnits = data.self;
          console.log(vm.selfUnits);
          [...data.self, ...data.enemy].forEach(el => {
            let hero = getUnit(
              el,
              el.x,
              el.y,
              el.x > 14 ? -0.2 : 0.2,
              el.nickname || vm.socket.id
            );
            store.gameScene.addChild(hero);
          });
          vm.choose = false;
        });
        socket.on("user_leaved", user_leaved);
        socket.on("unit_moved", unit_moved);
        socket.on("update_stamina", update_stamina);
        socket.on("attacked", attacked);
        socket.on("poison_set", poison_set);
        socket.on("poison_hit", poison_hit);
        socket.on("turn_changed", turn_changed);
        socket.on("unit_changed", unit_changed);
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
      .add("./assets/teleport.png")
      .add([
        ...Object.values(r.data.units).reduce((acc, unit) => {
          if (!unit.img) return acc;
          ["idle", "attack", "hurt", "run", "death"].forEach(key => {
            acc.push(`./assets/characters/${unit.img.name}/${key}.png`);
          });
          return acc;
        }, []),
      ])
      .load(() => this.initPixi());
    this.units = r.data.units;
    this.items = r.data.items;
  },
};
</script>
