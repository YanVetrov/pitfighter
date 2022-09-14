<template>
  <div class="main_view">
    <div class="resources">
      <div
        class="resource"
        :style="`background-image:url(${require('./assets/slot1.png')});`"
        v-for="(count, name) in resources"
        :key="name"
      >
        <img :src="require(`./assets/${name}.png`)" /> {{ count }}
      </div>
    </div>

    <div class="buttons" :class="{ zIndex2: tutorial_step === 1 }">
      <div
        class="button shop"
        :class="{ bubble: tutorial_step === 1 }"
        :style="`background-image:url(${require('./assets/bt1.png')});`"
        id="tutorial1"
        @click="
          showMenu = true;
          setTutorialStep();
        "
      >
        <img src="./assets/molotok.png" />
      </div>
      <div
        class="button shop"
        :class="{ opacity05: tutorial_step === 1 }"
        :style="`background-image:url(${require('./assets/bt1.png')});`"
        @click="showMenu = true"
      >
        <img src="./assets/fight.png" />
      </div>
      <div
        class="button shop"
        :class="{ opacity05: tutorial_step === 1 }"
        :style="`background-image:url(${require('./assets/bt1.png')});`"
        @click="showMenu = true"
      >
        <img src="./assets/info.png" />
      </div>
      <div
        class="button shop"
        :class="{ opacity05: tutorial_step === 1 }"
        :style="`background-image:url(${require('./assets/bt1.png')});`"
        @click="
          tutorial = true;
          arrow = true;
          setTutorialStep();
        "
      >
        <img src="./assets/question.png" />
      </div>
      <div
        class="button shop"
        :class="{ opacity05: tutorial_step === 1 }"
        :style="`background-image:url(${require('./assets/bt1.png')});`"
        @click="showMenu = true"
      >
        <img src="./assets/settings.png" />
      </div>
    </div>
    <transition name="fade">
      <div class="aim_mode" v-if="aimMode">Choose build location</div>
    </transition>
    <transition name="fade">
      <menuWrapper
        v-if="showMenu"
        :tabs="tabs"
        :activeTab="activeTab"
        :coins="coins"
        :runes="runes"
        :class="{ zIndex2: tutorial_activeMenu[tutorial_step] }"
        @switchTab="activeTab = $event"
        @missclick="showMenu = false"
      >
        <component
          :inventory="inventory"
          :itemsPrice="itemsPrice"
          :spawned="selfBuildings"
          :objectsOnMap="objectsOnMap"
          :resources="resources"
          :units="unitsTemplates"
          :tutorial_step="tutorial_step"
          @setTutorial="
            setTutorialStep();
            aimMode = true;
            cashBuild = $event;
            showMenu = false;
          "
          @buyItem="buyItem"
          @buyUnit="buyUnit"
          @spawnBuild="
            aimMode = true;
            cashBuild = $event;
            showMenu = false;
          "
          :is="activeTab"
        />
      </menuWrapper>
    </transition>
    <div class="inventory">
      <div class="inventory_title">INVENTORY</div>
      <div class="inventory_items row center">
        <div
          class="inventory_item column center"
          v-for="item in inventory"
          :key="item"
        >
          <img :src="require(`./assets/${item}.png`)" />{{ item }}
        </div>
      </div>
    </div>
    <div class="blocked" v-if="tutorial && tutorial_step"></div>
    <transition name="faded">
      <div
        class="arrow"
        :style="{ top: arrow_y, left: arrow_x }"
        ref="arrow"
        v-show="arrow && tutorial_step"
      >
        <img
          v-if="arrow_visible"
          class="arrow_img"
          src="./assets/strelka.png"
        />
        <div class="arrow_text">
          {{ tutorial_text[tutorial_step] }}
        </div>
        <img class="dwarf" src="./assets/dwarf.png" />
      </div>
    </transition>
    <div
      class="login_view"
      :style="`background-image:url(${require('./assets/bg2.png')});`"
      v-if="showLogin"
    >
      <div class="login_block">
        <div class="login_title">PitFarmer</div>
        <div style="color: red">{{ loginError }}</div>
        <div
          class="login_name"
          :style="`background-image:url(${require('./assets/input2.png')});`"
        >
          <input v-model="login" placeholder="Enter your login..." />
        </div>
        <div
          class="login_pass"
          :style="`background-image:url(${require('./assets/input2.png')});`"
        >
          <input v-model="password" placeholder="and your password..." />
        </div>
        <div
          class="button"
          :style="`background-image:url(${require('./assets/bt2.png')});`"
          v-if="!loginTimeout"
          @click="enterLogin"
        >
          ENTER
        </div>
      </div>
    </div>
    <canvas id="canvas1"></canvas>
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
} from "pixi.js";
import {
  initMap,
  enableInteractiveMap,
  centeringMap,
  createAnimatedSprite,
} from "./functionality";
import { BevelFilter } from "@pixi/filter-bevel";
import { GlowFilter } from "@pixi/filter-glow";
import { store } from "./store";
import { gsap } from "gsap";
import { initGsap } from "./utils";
import buildings from "./components/buildings.vue";
import items from "./components/items.vue";
import characters from "./components/characters.vue";
import menuWrapper from "./components/menuWrapper.vue";
import axios from "axios";
import { io } from "socket.io-client";
import { Spine } from "pixi-spine";
let tabs = [
  { component: buildings, title: "buildings" },
  { component: characters, title: "characters" },
  { component: {}, title: "forge" },
  { component: {}, title: "market" },
];
let { objectsOnMap, itemsPrice } = store;
let domain = "";
if (window.location.href.includes("localhost"))
  domain = "http://localhost:8080";
export default {
  components: { buildings, menuWrapper, items, characters },
  data() {
    return {
      objectsOnMap: [],
      unitsTemplates: {},
      selfBuildings: [],
      selfUnits: [],
      enemies: [],
      itemsPrice,
      showLogin: true,
      loginTimeout: "",
      showMenu: false,
      loginError: "",
      aimMode: false,
      cashBuild: null,
      tutorial: false,
      arrow: false,
      arrow_x: 0,
      arrow_y: 0,
      arrow_visible: true,
      tutorial_step: 0,
      tutorial_activeMenu: {
        2: true,
        4: true,
        6: true,
      },
      tutorial_text: [
        "",
        "first of all, to obtain resources, you need to build a building, you can buy it in the store",
        "select your first building, the required resources for its construction are indicated in the corner of the card",
        "above the building is a strip with the amount of resources, just click on the building to collect",
        "it is very dangerous in the area and it would be nice to have defenders, for a start we will buy a camp for them",
        "this is your army camp, click here",
        "in the characters tab you will find fighters available for purchase, lets buy one",
        "good luck boy.",
      ],
      tabs,
      login: "admin",
      password: "admin",
      activeTab: tabs[0].component,
      coins: 0,
      runes: 0,
      resources: {
        wood: 0,
        stone: 0,
        steel: 0,
        leather: 0,
      },
      inventory: [],
      spawned: [],
    };
  },
  computed: {
    keysBuildings() {
      return this.selfBuildings.reduce((acc, el) => {
        acc[el.id] = el;
        return acc;
      }, {});
    },
  },
  methods: {
    getTime(num) {
      let d = new Date(num);
      let h = d.getHours();
      let m = d.getMinutes();
      let s = d.getSeconds();
      let str = [h, m, s].map((el) => (el < 10 ? "0" + el : el)).join(":");
      return str;
    },
    setTutorialStep() {
      if (!this.tutorial || !this.arrow) return 0;
      this.tutorial_step++;
      let step = this.tutorial_step;
      setTimeout(() => {
        console.log("step");
        let arrow = this.$refs.arrow.getBoundingClientRect();
        console.log(arrow);
        let tutorial = document.getElementById("tutorial" + step);
        console.log(tutorial);
        if (tutorial) {
          this.arrow = true;
          this.tutorial = true;
          tutorial = tutorial.getBoundingClientRect();
        } else {
          this.arrow = false;
          this.tutorial = false;
          console.log(this.tutorial_step);
          return 0;
        }
        console.log(arrow, tutorial);
        this.arrow_x = tutorial.x + "px";
        this.arrow_y = tutorial.y - arrow.height + "px";
      }, 200);
    },
    async enterLogin() {
      this.loginError = "";
      let { login, password } = this;
      var form_data = new FormData();
      form_data.append("username", login);
      form_data.append("password", password);
      let res = await axios.post(`${domain}/login`, form_data);
      res = res.data;
      if (res.error) return (this.loginError = res.message);
      let { coins, runes, resources, buildings, units, enemies } = res;
      this.coins = coins;
      this.runes = runes;
      this.resources = resources;
      this.selfBuildings = buildings;
      this.selfUnits = units;
      this.enemies = enemies;
      if (!this.selfBuildings.length) {
        this.tutorial = true;
        this.arrow = true;
        this.setTutorialStep();
      }
      let url = undefined;
      if (window.location.href.includes("localhost"))
        url = "ws://localhost:8080";
      const socket = await io(url);
      socket.status = "waiting";
      console.log(socket);
      this.socket = socket;
      this.showLogin = false;
      this.renderMap();
      socket.on("new_build", (build) => {
        this.showMenu = false;
        this.addObjectOnMap(build, true);
        this.selfBuildings.push(build);
      });
      socket.on("new_unit", (unit) => {
        if (this.tutorial_step === 6) {
          this.setTutorialStep();
          setTimeout(() => {
            this.arrow_visible = false;
            this.arrow = true;
            this.arrow_x = "10px";
            this.arrow_y = "100px";
          }, 250);
          setTimeout(() => (this.arrow = false), 2000);
        }
        this.showMenu = false;
        this.addUnitOnMap(unit, true);
        this.selfUnits.push(unit);
      });
      socket.on("update_resources", (reses) => (this.resources = reses));
      socket.on("build_collected", async (ev) => {
        let build = store.selfBuildings[ev.id];
        if (!build) return 0;
        build.gs_store = 0;
        console.log(build.tutorial);
        if (build.tutorial) {
          console.log(build.tutorial);
          if (this.tutorial_step === 5) {
            this.activeTab = this.tabs[1].component;
          }
          setTimeout(() => {
            this.showMenu = true;
            this.tutorial = true;
            this.arrow = true;
            store.gameScene.removeChild(build.tutorial);
            build.tutorial = null;
            this.setTutorialStep();
          }, 1500);
        }
        await build.shuffle();
        await build.alphaCounter(
          `+ ${ev.lastCollected}`,
          undefined,
          undefined,
          ev.resource
        );
        build = this.keysBuildings[ev.id];
        build.store = 0;
      });
      socket.on("update_build", (data) => {
        console.log("update");
        let build = store.selfBuildings[data.id];
        if (!build) return 0;
        build.gs_store = data.store;
        build.gs_nextTickIn = data.nextTickIn;

        build = this.keysBuildings[data.id];
        build.store = data.store;
        build.nextTickIn = data.nextTickIn;
      });
      socket.on("move_unit", (unit) =>
        this.moveUnit(unit, { x: unit.posX, y: unit.posY })
      );
      socket.on("unit_attacked", ({ unit, target }) =>
        this.attack(unit, target)
      );
      socket.on("unit_dead", async (unit) => {
        let u = store.units[unit.id];
        await gsap.to(u, { alpha: 0 });
        store.gameScene.removeChild(u);
      });
    },

    spawnBuild({ name, rarity, x, y }) {
      console.log(name, rarity, x, y);
      this.socket.emit("buy_building", { name, rarity, x, y });
    },
    buyUnit() {
      this.socket.emit("buy_unit", {});
    },
    buyItem() {},
    renderMap() {
      store.gameScene.children.forEach((el) => store.gameScene.removeChild(el));
      console.log(store.gameScene.children);
      let date = Date.now();
      console.log("map ready " + (Date.now() - date));
      console.log("map rendered " + (Date.now() - date));
      store.map.flat().forEach((el, i) => this.addSprite(el, i));
      this.selfBuildings.forEach((el) => this.addObjectOnMap(el));
      this.selfUnits.forEach((el) => this.addUnitOnMap(el));
      this.enemies.forEach((el) => this.addUnitOnMap(el));
    },

    addSprite(target, i) {
      let index = i;
      let multipler =
        (store.groundHeight - 2) * Math.ceil(i / store.cellsInLine) - 1;
      let multiplerX = -(store.groundWidth * Math.floor(i / store.cellsInLine));
      // let multiplerX = 0;
      if (multipler === 0) multipler = 200;
      // if (index === 0) i = 1;
      i = i % store.cellsInLine;
      target.x = (i * (store.groundWidth - 2)) / 2 - 250 + multiplerX / 2 + i;
      if (i === 0) i = 1;
      target.y = (i * (store.groundHeight - 2)) / 2 - 250 + multipler / 2;
      target.y -= target.height - 143;
      target.originY = target.y;
      target.originX = target.x;
      target.interactive = true;
      target.buttonMode = true;
      // if (!target.isSprite) target.zIndex = store.cellsInLine - i;
      store.gameScene.addChild(target);
      if (target.unclickable) return 0;
      target.on("pointerover", (e) => {
        let color = 0xff69;

        let filter = new GlowFilter({
          lightColor: color,
          thickness: 5,
          rotation: 0,
          shadowColor: color,
          lightAlpha: 1,
          shadowAlpha: 1,
        });
        if (target.obj) {
          target.obj.sprite.filters = [filter];
          // target.zIndex = 1;
        } else {
          target.filters = [filter];
          if (target.type === "grass")
            gsap.to(target, { y: target.originY - 5 });
          if (this.aimMode && !target.ghost) {
            let sprite = new Sprite(
              store.app.loader.resources[
                `./assets/${this.cashBuild.name}${this.cashBuild.rarityNum}.png`
              ].texture
            );
            sprite.alpha = 0.5;
            sprite.scale.set(0.6);
            sprite.x = 50;
            sprite.y = -50;
            target.addChild(sprite);
            target.ghost = sprite;
          }
        }
      });
      target.on("pointerout", (e) => {
        target.filters = [];
        // target.zIndex = 0;
        if (target.ghost) {
          target.removeChild(target.ghost);
          target.ghost = null;
          gsap.to(target, { y: target.originY });
        }
        if (target.obj) target.obj.sprite.filters = [];
        else {
          gsap.to(target, { y: target.originY });
        }
      });
      target.on("pointerup", (e) => this.clickSprite(target, event));
      target.hitArea = new Polygon([
        0,
        target.height / 2,
        target.width / 2,
        0,
        target.width,
        target.height / 2,
        target.width / 2,
        target.height,
      ]);
    },
    async clickSprite(target, event) {
      if (target.blocked) return 0;
      target.blocked = true;
      if (store.gameScene.blockedUI) return (target.blocked = false);
      if (target.timeout) return 0;
      console.log(store.selfBuildings);
      let { type } = target;
      if (["forrest", "mountain", "lake"].includes(type)) {
        gsap.to(target.sprite, { alpha: 0.5, duration: 0.5 });
        target.timeout = setTimeout(() => {
          gsap.to(target.sprite, { alpha: 1, duration: 0.5 });
          target.timeout = null;
        }, 2000);
        if (type === "forrest") {
          target.mine("axe");
        }
        if (type === "mountain") {
          target.mine("pickaxe");
        }
      }
      if (type === "building") {
        console.log("build click");
        this.socket.emit("collect_build", { id: target.obj.id });
      }
      if (type === "grass" && this.aimMode) {
        this.aimMode = false;
        this.spawnBuild({ ...this.cashBuild, x: target.posX, y: target.posY });
        this.cashBuild = null;
      }
      setTimeout(() => (target.blocked = false), 300);
    },
    checkTimers() {
      this.checker = setInterval(() => {
        Object.values(store.selfBuildings)
          .filter((el) => el.building_type !== "army")
          .forEach((build) => {
            if (build.nextTickIn < Date.now()) return 0;
            let allSeconds = Math.ceil((build.nextTickIn - Date.now()) / 1000);
            let seconds = allSeconds % 60;
            if (seconds < 10) seconds = "0" + seconds;
            let minutes = Math.floor(Math.floor(allSeconds / 60) % 60);
            if (minutes < 10) minutes = "0" + minutes;
            let hours = Math.floor(allSeconds / 60 / 60);
            if (hours < 10) hours = "0" + hours;
            build.timerNode.text = `${hours}:${minutes}:${seconds}`;
          });
      }, 1000);
    },
    async addObjectOnMap(el, newBuild = false) {
      console.log(el);
      el.x = el.defaultX;
      el.y = el.defaultY;
      if (!el.x || !el.y) return 0;
      let container = new Container();
      let sprite = new Spine(
        store.app.loader.resources[
          `./assets/${el.name}${el.rarityNum}/${el.name}${el.rarityNum}.json`
        ].spineData
      );
      sprite.state.setAnimation(0, "animation", true);
      let ground = store.map[el.y][el.x];
      ground.obj = container;
      container.ground = ground;
      container.addChild(sprite);
      sprite.scale.y = (ground.children[0].width / sprite.width) * 0.6;
      sprite.scale.x = (ground.children[0].width / sprite.width) * 0.6;
      console.log(ground.children[0].width / sprite.width);
      if (el.scaled) {
        container.scale.x *= el.scaled;
        container.scale.y *= el.scaled;
      }
      let x = ground.x;
      let y = ground.y;
      x += ground.width / 2;
      y += ground.height / 4;
      container.y = y;
      container.x = x;
      container.alpha = 0;
      container.sprite = sprite;
      container.type = el.type;
      container.zIndex = Number(el.y + "" + el.x) * 10;
      [
        "store",
        "name",
        "type",
        "storage",
        "nextTickIn",
        "owner",
        "countPerTick",
        "tick",
        "rarityNum",
        "id",
      ].forEach((key) => (container[key] = el[key]));
      container.shuffle = async function () {
        let { x, y } = this.sprite.scale;
        await gsap.to(this.sprite.scale, {
          duration: 0.3,
          x: x * 0.95,
          y: y * 1.05,
        });
        await gsap.to(this.sprite.scale, {
          duration: 0.2,
          x: x * 1.05,
          y: y * 0.95,
        });
        await gsap.to(this.sprite.scale, { duration: 0.1, x, y });
      };
      container.alphaCounter = async function (
        text = "+1",
        color = 0xeeeeee,
        delay = 0,
        sprite
      ) {
        let options = {
          fill: color,
          fontFamily: "gothic",
          fontSize: 30,
          wordWrapWidth: 100,
          stroke: "#333",
          strokeThickness: 4,
          trim: true,
        };
        if (delay) {
          options = {
            ...options,
            ...{
              breakWords: true,
              padding: 16,
              fontSize: 25 - text.length / 5,
            },
          };
        }
        if (/\p{Extended_Pictographic}/u.test(text)) options.fontSize = 55;
        let node = new Text(text, options);
        let container = new Container();
        container.addChild(node);
        container.zIndex = 12;
        this.addChild(container);
        // container.x = 15;
        if (delay) {
          container.x = 40 - text.length * 1.5;
        }
        // container.y = 40;
        if (sprite) {
          let spr = Sprite.from(`./assets/${sprite}.png`);
          spr.scale.set(0.2);
          container.addChild(spr);
          spr.x = 15;
          container.sortChildren = true;
          spr.zIndex = 3;
        }
        await gsap.to(container, { y: -30, alpha: 0, duration: 2, delay });
        this.removeChild(container);
      };
      ground.type = el.type;
      ground.name = el.name;
      container.building_type = el.building_type;
      if (el.type === "building") {
        let text = new Text(el.name, {
          fontSize: 12,
          fontFamily: "gothic",
          fill: "#ffaf00",
          stroke: "#333",
          strokeThickness: 2,
        });
        container.addChild(text);
        text.x = -30;
        text.y = -70;
      }
      let storeBar = new Container();
      container.addChild(storeBar);
      storeBar.zIndex = 3;
      let innerBar = new Graphics();
      innerBar.beginFill(0xababab);
      innerBar.drawRoundedRect(0, 0, 70, 10, 30);
      innerBar.endFill();
      storeBar.addChild(innerBar);

      let outerBar = new Graphics();
      container.storeBar = outerBar;
      let percent = (el.store / el.storage) * 100;
      outerBar.beginFill(0xff9900);
      outerBar.drawRoundedRect(0, 0, percent || 1, 10, 80);
      outerBar.endFill();
      storeBar.addChild(outerBar);
      storeBar.outer = outerBar;
      container.storeText = new Text(`${el.store}/${el.storage}`, {
        fill: 0xefefef,
        fontFamily: "gothic",
        fontSize: 7,
        stroke: "#454545",
        strokeThickness: 1,
      });
      container.storeText.x = 30;
      storeBar.y = -80;
      storeBar.x = -30;
      storeBar.addChild(container.storeText);
      if (el.building_type !== "army") {
        const timerNode = new Text("", {
          fill: 0xefefef,
          fontFamily: "gothic",
          fontSize: 13,
          stroke: "#454545",
          strokeThickness: 2,
        });
        timerNode.y = -100;
        timerNode.x = -30;
        container.timerNode = timerNode;
        container.addChild(timerNode);
      }
      gsap.to(ground, { y: ground.originY });
      ground.removeChild(ground.ghost);
      ground.ghost = null;
      Object.defineProperty(container, "gs_nextTickIn", {
        get() {
          return this.nextTickIn;
        },
        async set(val) {
          this.nextTickIn = val;
        },
      });
      Object.defineProperty(container, "gs_store", {
        get() {
          return this.store;
        },
        async set(val) {
          let percent = (val / this.storage) * 100;
          this.storeBar.width = percent || 1;
          this.store = val;
          this.storeText.text = `${val}/${this.storage}`;
          await gsap.to(this.storeText.scale, {
            x: 1.1,
            y: 1.1,
            duration: 0.1,
          });
          await gsap.to(this.storeText.scale, { x: 1, y: 1, duration: 0.1 });
        },
      });
      store.gameScene.addChild(container);
      store.selfBuildings[el.id] = container;
      let duration = 0;
      if (newBuild) duration = 0.5;
      await gsap.to(container, { duration, alpha: 1, y });
      if (this.tutorial_step === 3 || this.tutorial_step === 5) {
        let build = ground;
        let spr = Sprite.from("./assets/strelka.png");
        let dwarf = Sprite.from("./assets/dwarf.png");
        let con = new Container();
        let text = new Text(this.tutorial_text[this.tutorial_step], {
          fontSize: 15,
          fontFamily: "gothic",
          fill: "#eeeeff",
          stroke: "#333",
          strokeThickness: 3,
          wordWrap: true,
          wordWrapWidth: 150,
        });
        dwarf.scale.set(0.2);
        dwarf.x = -130;
        dwarf.y = -40;
        con.addChild(spr);
        con.addChild(text);
        con.addChild(dwarf);
        text.y = -165;
        con.x = build.x - 50;
        con.y = build.y;
        con.zIndex = 9999;
        con.alpha = 0;
        gsap.to(con, { alpha: 1 });
        gsap.to(spr, { x: spr.x + 20, yoyo: true, repeat: -1 });
        store.gameScene.addChild(con);
        container.tutorial = con;
        console.log(con);
      }
      if (el.advice) {
        console.log(el.advice);
        container.alphaCounter(el.advice);
      }
    },
    async moveUnit(unit, { x, y }) {
      x = unit.posX;
      y = unit.posY;
      unit = store.units[unit.id];
      let ground = store.map[y][x];
      let dir = this.getDirection(
        { x: unit.x, y: unit.y },
        { x: ground.x, y: ground.y }
      );
      // console.log(dir);
      unit.sprite._textures = unit.run[dir];
      unit.state = "run";
      let xx = ground.x + Math.random() * (30 - -30) + -30;
      let yy = ground.y + Math.random() * (30 - -30) + -30;
      unit.posX = ground.posX;
      unit.posY = ground.posY;
      await gsap.to(unit, { x: xx, y: yy, duration: 4 });
      if (unit.state !== "attack") {
        unit.sprite._textures = unit.idle[dir];
        unit.state = "idle";
        unit.dir = dir;
      }
    },
    async attack(unit, target) {
      let local_unit = store.units[unit.id];
      let local_target = store.units[target.id];
      if (!local_target) local_target = store.selfBuildings[target.id];
      if (!local_target) return 0;
      local_unit.sprite.animationSpeed = Math.random() * (0.4 - 0.15) + 0.15;
      local_unit.state = "attack";
      let local_y = local_unit.y;
      let target_y = local_target.y;
      let local_x = local_unit.x;
      let target_x = local_target.x;
      let dir = this.getDirection(
        { x: local_x, y: local_y },
        { x: target_x, y: target_y }
      );
      local_unit.sprite._textures = local_unit.run[dir];
      local_unit.dir = dir;
      while (Math.abs(local_x - target_x) > local_unit.width / 3) {
        if (local_x > target_x) local_x--;
        if (local_x < target_x) local_x++;
      }
      while (Math.abs(local_y - target_y) > local_unit.width / 3) {
        if (local_y > target_y) local_y--;
        if (local_y < target_y) local_y++;
      }

      await gsap.to(local_unit, { y: local_y, x: local_x, duration: 0.5 });
      dir = this.getDirection(
        { x: local_x, y: local_y },
        { x: target_x, y: target_y }
      );
      local_unit.sprite._textures = local_unit.attack[dir];
      local_unit.dir = dir;
      if (local_target.type === "unit") {
        local_target.health = target.hp;
      } else local_target.gs_store = target.store;
      setTimeout(() => {
        local_unit.sprite._textures = local_unit.idle[dir];
        local_unit.state = "idle";
      }, 4000);
    },
    addUnitOnMap(el) {
      let directions = ["ur", "ul", "dl", "dr"];
      let cnts = { attack: 12, run: 10, idle: 10, death: 12, hurt: 14 };
      let random = Math.ceil(Math.random() * (directions.length - 1));
      let container = new Container();
      Object.keys(cnts).forEach((key) => {
        container[key] = {};
        directions.forEach((dir) => {
          if (!container[key][dir]) container[key][dir] = [];
          for (let i = 1; i <= cnts[key]; i++) {
            container[key][dir].push(
              Texture.from(`./assets/warrior/${key}/${dir}/t${i}.png`)
            );
          }
        });
      });
      let sprite = new AnimatedSprite(container.idle[directions[random]]);
      sprite.play();
      container.addChild(sprite);
      container.sprite = sprite;
      container.dir = "dr";
      sprite.animationSpeed = 0.3;
      let ground = store.map[el.posY][el.posX];
      let x = ground.x + Math.random() * (30 - -30) + -30;
      let y = ground.y + Math.random() * (30 - -30) + -30;
      let armycamp = Object.values(store.selfBuildings).find(
        (el) => el.building_type === "army"
      );
      if (el.enemy) armycamp = store.map[3][2];
      container.zIndex = 99999;
      x = armycamp.x;
      y = armycamp.y;
      if (el.enemy) {
        x += 70;
        y += 30;
      }

      container.y = y;
      container.x = x;
      container.scale.set(0.6);
      container.posX = ground.posX;
      container.posY = ground.posY;
      container.strength = el.strength;
      container.hp = el.hp;
      container.type = el.type;
      container.id = el.id;
      let healthBar = new Container();
      healthBar.x = 80;
      healthBar.y = 80;
      container.addChild(healthBar);
      healthBar.zIndex = 3;
      let innerBar = new Graphics();
      innerBar.beginFill(0x333);
      innerBar.drawRoundedRect(0, 0, 70, 5, 30);
      innerBar.endFill();
      healthBar.addChild(innerBar);

      let outerBar = new Graphics();
      let percent = (el.hp / el.strength) * 100;
      outerBar.beginFill(el.enemy ? 0xff0033 : 0x5599aa);
      outerBar.drawRoundedRect(0, 0, (el.hp / el.strength) * 100, 5, 30);
      outerBar.endFill();
      healthBar.addChild(outerBar);
      healthBar.outer = outerBar;
      container.healthBar = outerBar;
      Object.defineProperty(container, "health", {
        get() {
          return this.hp;
        },
        async set(val) {
          let percent = (val / this.strength) * 100;
          this.healthBar.width = percent || 1;
          if (this.hp > val && val > 0 && this.state !== "attack") {
            this.sprite._textures = this.hurt[this.dir];
            this.state = "hurt";
            this.sprite.gotoAndPlay(0);
            setTimeout(() => {
              this.sprite._textures = this.idle[this.dir];
              this.state = "idle";
            }, 750);
          }
          this.hp = val;
          if (this.hp <= 0) {
            this.sprite._textures = this.death[this.dir];
            this.sprite.loop = false;
            this.sprite.gotoAndPlay(0);
            this.state = "dead";
            gsap.to(this, { alpha: 0, delay: 1 });
          }
        },
      });
      if (el.hp <= 0) container.alpha = 0;
      store.gameScene.addChild(container);
      store.units[el.id] = container;
      this.moveUnit(container, { x, y });
    },
    getDirection(fromPlace = {}, toPlace = {}) {
      if (fromPlace.x > toPlace.x && fromPlace.y == toPlace.y) return "ul";
      if (fromPlace.x < toPlace.x && fromPlace.y == toPlace.y) return "dr";
      if (fromPlace.y > toPlace.y && fromPlace.x == toPlace.x) return "ur";
      if (fromPlace.y < toPlace.y && fromPlace.x == toPlace.x) return "dl";
      if (fromPlace.x > toPlace.x && fromPlace.y > toPlace.y) return "ul";
      if (fromPlace.x < toPlace.x && fromPlace.y < toPlace.y) return "dr";
      if (fromPlace.x < toPlace.x && fromPlace.y > toPlace.y) return "ur";
      if (fromPlace.x > toPlace.x && fromPlace.y < toPlace.y) return "dl";
      return "ul";
    },
    async initPixi() {
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
      store.app = app;
      console.log("wowo");

      store.gameScene = new Container();
      store.gameScene.sortableChildren = true;
      store.gameScene.zIndex = 2;
      store.gameScene.x = store.defaultPosX;
      store.gameScene.y = store.defaultPosY;
      app.stage.addChild(store.gameScene);
      app.stage.sortableChildren = true;
      app.renderer.backgroundColor = "0x8db792";
      app.renderer.autoResize = true;
      let res = await axios.post(`${domain}/templates`);
      res = res.data;
      this.objectsOnMap = Object.values(res.builds);
      store.objectsOnMap = Object.values(res.builds);
      this.resources = res.resources;
      this.unitsTemplates = res.characters;
      app.loader
        .add(
          [
            store.top,
            store.bottom,
            store.left,
            store.right,
            store.center,
          ].reduce((acc, el) => {
            for (let i = 0; i < el.split("-")[1]; i++) {
              let path = `./assets/${el.split("-")[0]}${i + 1}.png`;
              if (!acc.includes(path)) acc.push(path);
            }
            return acc;
          }, [])
        )
        .add(
          store.objectsOnMap.map(
            (el) =>
              `./assets/${el.name}${el.rarityNum}/${el.name}${el.rarityNum}.json`
          )
        )
        .add(
          store.objectsOnMap.map(
            (el) => `./assets/${el.name}${el.rarityNum}.png`
          )
        )
        .add("gothic", "./assets/gothic.otf")
        .load(setup);
      function setup(loader, res) {
        console.log(store.app.loader.resources);
        store.map = initMap("", store, store.allMapCount);
        vm.renderMap();
        vm.checkTimers();
        centeringMap(store.gameScene, store);
        enableInteractiveMap(
          document.querySelector("canvas"),
          store.gameScene,
          store
        );
        // vm.addUnitOnMap({ posX: 5, posY: 5, hp: 50, strength: 100 });
        window.addEventListener("resize", (e) => {
          app.renderer.resize(window.innerWidth, window.innerHeight);
        });
        document
          .querySelector("canvas")
          .addEventListener("contextmenu", (e) => {
            e.preventDefault();
          });
        document.addEventListener(
          "contextmenu",
          (e) => {
            e.preventDefault();
            e.stopPropagation();
          },
          true
        );
      }
    },
  },
  async mounted() {
    this.initPixi();
    store.vue = this;
  },
};
</script>
