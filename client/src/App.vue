<template>
  <div class="main_view">
    <div class="resources">
      <div class="resource" v-for="(count, name) in resources" :key="name">
        <img :src="require(`./assets/${name}.png`)" /> {{ count }}
      </div>
    </div>

    <div class="buttons">
      <div class="button" @click="showMenu = true">
        <img src="./assets/molotok.png" />
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
        @switchTab="activeTab = $event"
        @missclick="showMenu = false"
      >
        <component
          :inventory="inventory"
          :itemsPrice="itemsPrice"
          :spawned="selfBuildings"
          :objectsOnMap="objectsOnMap"
          :resources="resources"
          @buyItem="buyItem"
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
    <div class="login_view" v-if="showLogin">
      <div class="login_block">
        <div class="login_title">PitFarmer</div>
        <div style="color: red">{{ loginError }}</div>
        <div class="login_name">
          <input v-model="login" placeholder="Enter your login..." />
        </div>
        <div class="login_pass">
          <input v-model="password" placeholder="and your password..." />
        </div>
        <div class="button" v-if="!loginTimeout" @click="enterLogin">ENTER</div>
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
import { initMap, enableInteractiveMap, centeringMap } from "./functionality";
import { BevelFilter } from "@pixi/filter-bevel";
import { GlowFilter } from "@pixi/filter-glow";
import { store } from "./store";
import { gsap } from "gsap";
import { initGsap } from "./utils";
import buildings from "./components/buildings.vue";
import items from "./components/items.vue";
import menuWrapper from "./components/menuWrapper.vue";
import axios from "axios";
import { io } from "socket.io-client";
let tabs = [
  { component: buildings, title: "buildings" },
  { component: items, title: "characters" },
  { component: {}, title: "forge" },
  { component: {}, title: "market" },
];
let { objectsOnMap, itemsPrice } = store;
let domain = "";
if (window.location.href.includes("localhost")) domain = "ws://localhost:8080";
export default {
  components: { buildings, menuWrapper, items },
  data() {
    return {
      objectsOnMap: [],
      selfBuildings: [],
      itemsPrice,
      showLogin: true,
      loginTimeout: "",
      showMenu: false,
      loginError: "",
      aimMode: false,
      cashBuild: null,
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
    async enterLogin() {
      this.loginError = "";
      let { login, password } = this;
      var form_data = new FormData();
      form_data.append("username", login);
      form_data.append("password", password);
      let res = await axios.post(`${domain}/login`, form_data);
      res = res.data;
      if (res.error) return (this.loginError = res.message);
      let { coins, runes, resources, buildings } = res;
      this.coins = coins;
      this.runes = runes;
      this.resources = resources;
      this.selfBuildings = buildings;
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
      socket.on("update_resources", (reses) => (this.resources = reses));
      socket.on("build_collected", async (ev) => {
        let build = store.selfBuildings[ev.id];
        if (!build) return 0;
        build.gs_store = 0;
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
    },

    spawnBuild({ name, rarity, x, y }) {
      console.log(name, rarity, x, y);
      this.socket.emit("buy_building", { name, rarity, x, y });
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
          target.zIndex = 1;
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
            target.addChild(sprite);
            target.ghost = sprite;
          }
        }
      });
      target.on("pointerout", (e) => {
        target.filters = [];
        target.zIndex = 0;
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
      console.log(target, store.selfBuildings);
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
        Object.values(store.selfBuildings).forEach((build) => {
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
      let sprite = new Sprite(
        store.app.loader.resources[
          `./assets/${el.name}${el.rarityNum}.png`
        ].texture
      );
      const filter = new PIXI.Filter();
      let ground = store.map[el.y][el.x];
      ground.obj = container;
      container.ground = ground;
      container.addChild(sprite);
      container.scale.x = ground.height / sprite.height;
      container.scale.y = ground.height / sprite.height;
      if (el.scaled) {
        container.scale.x *= el.scaled;
        container.scale.y *= el.scaled;
      }
      let x = ground.x;
      let y = ground.y;
      x += (ground.width - container.width) / 2;
      y += (ground.height - container.height) / 2 - ground.height / 6;
      container.y = y - 200;
      container.x = x;
      container.alpha = 0;
      container.sprite = sprite;
      container.zIndex = el.y + el.x;
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
        await gsap.to(this.sprite.scale, { duration: 0.3, x: 0.95, y: 1.05 });
        await gsap.to(this.sprite.scale, { duration: 0.2, x: 1.05, y: 0.95 });
        await gsap.to(this.sprite.scale, { duration: 0.1, x: 1, y: 1 });
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
        container.x = 40;
        if (delay) {
          container.x = 40 - text.length * 1.5;
        }
        container.y = 40;
        if (sprite) {
          let spr = Sprite.from(`./assets/${sprite}.png`);
          spr.scale.set(0.4);
          container.addChild(spr);
          container.sortChildren = true;
          spr.zIndex = 3;
        }
        await gsap.to(container, { y: 0, alpha: 0, duration: 2, delay });
        this.removeChild(container);
      };
      ground.type = el.type;
      ground.name = el.name;
      if (el.type === "building") {
        let text = new Text(el.name, {
          fontSize: 22,
          fontFamily: "gothic",
          fill: "#ffaf00",
          stroke: "#333",
          strokeThickness: 4,
        });
        container.addChild(text);
        text.x = (ground.width - text.width) / 2;
        text.y -= text.height;
      }
      let storeBar = new Container();
      storeBar.x = 50;
      storeBar.y = 20;
      container.addChild(storeBar);
      storeBar.zIndex = 3;
      let innerBar = new Graphics();
      innerBar.beginFill(0xababab);
      innerBar.drawRoundedRect(0, 0, 100, 15, 30);
      innerBar.endFill();
      storeBar.addChild(innerBar);

      let outerBar = new Graphics();
      container.storeBar = outerBar;
      let percent = (el.store / el.storage) * 100;
      outerBar.beginFill(0xff9900);
      outerBar.drawRoundedRect(0, 0, percent || 1, 15, 80);
      outerBar.endFill();
      storeBar.addChild(outerBar);
      storeBar.outer = outerBar;
      container.storeText = new Text(`${el.store}/${el.storage}`, {
        fill: 0xefefef,
        fontFamily: "gothic",
        fontSize: 10,
        stroke: "#454545",
        strokeThickness: 2,
      });
      container.storeText.x = 30;
      storeBar.y = -40;
      storeBar.x = 100;
      storeBar.addChild(container.storeText);
      const timerNode = new Text("", {
        fill: 0xefefef,
        fontFamily: "gothic",
        fontSize: 15,
        stroke: "#454545",
        strokeThickness: 2,
      });
      timerNode.y = -70;
      timerNode.x = 110;
      container.timerNode = timerNode;
      container.addChild(timerNode);
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
      if (el.advice) {
        console.log(el.advice);
        container.alphaCounter(el.advice);
      }
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
            (el) => `./assets/${el.name}${el.rarityNum}.png`
          )
        )
        .add("gothic", "./assets/gothic.otf")
        .load(setup);
      function setup() {
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
