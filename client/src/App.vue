<template>
  <div class="main_view">
    <div class="resources">
      <div class="resource" v-for="(count, name) in resources" :key="name">
        <img :src="require(`./assets/${name}.png`)" /> {{ count }}
      </div>
    </div>
    <div class="buttons">
      <div
        class="button"
        v-for="item in objectsOnMap.filter(el => el.type === 'building')"
        v-if="!spawned.includes(item.name)"
        :key="item.name"
        @click="spawnBuild(item.name, item.defaultX, item.defaultY)"
      >
        <img :src="require(`./assets/${item.name}${item.level}.png`)" />BUILD
        {{ item.name }} <br />
        <div
          class="row center"
          v-for="(val, key) in item.requirements"
          :key="key"
        >
          <img :src="require(`./assets/${key}.png`)" style="width:20px" />[{{
            resources[key]
          }}/{{ val }}]
        </div>
      </div>
      <div
        class="button"
        v-for="(item, name) in itemsPrice"
        v-if="!inventory.includes(name)"
        @click="buyItem(name)"
        :key="name"
      >
        <img :src="require(`./assets/${name}.png`)" />create {{ name }} <br />
        <div class="row center" v-for="(val, key) in item" :key="key">
          <img :src="require(`./assets/${key}.png`)" style="width:20px" />[{{
            resources[key]
          }}/{{ val }}]
        </div>
      </div>
    </div>
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
import { initMap, enableInteractiveMap } from "./functionality";
import { BevelFilter } from "@pixi/filter-bevel";
import { store } from "./store";
import { gsap } from "gsap";
import { initGsap } from "./utils";
let { objectsOnMap, itemsPrice } = store;
export default {
  data() {
    return {
      objectsOnMap,
      itemsPrice,
      resources: {
        wood: 0,
        stone: 0,
        food: 0,
        desk: 0,
        steel: 0,
        fur: 0,
        leather: 0,
      },
      inventory: [],
      spawned: [],
    };
  },
  computed: {},
  methods: {
    getTime(num) {
      let d = new Date(num);
      let h = d.getHours();
      let m = d.getMinutes();
      let s = d.getSeconds();
      let str = [h, m, s].map(el => (el < 10 ? "0" + el : el)).join(":");
      return str;
    },

    spawnBuild(name, x, y, resources) {
      let obj = store.objectsOnMap.find(el => el.name === name);
      if (!obj) return 0;
      resources = obj.requirements;
      if (
        Object.keys(resources).some(key => resources[key] > this.resources[key])
      )
        return 0;
      for (let key in resources) {
        this.resources[key] -= resources[key];
      }
      this.addObjectOnMap({
        ...obj,
        x,
        y,
        level: 1,
      });
      this.spawned.push(obj.name);
    },
    buyItem(name) {
      let resources = store.itemsPrice[name];
      if (
        Object.keys(resources).some(key => resources[key] > this.resources[key])
      )
        return 0;
      for (let key in resources) {
        console.log(this.resources, resources);
        this.resources[key] -= resources[key];
      }
      this.inventory.push(name);
    },
    async renderMap() {
      store.visibleZone.forEach(el => store.gameScene.removeChild(el));
      store.gameScene.children.forEach(el => store.gameScene.removeChild(el));
      store.visibleZone = [];
      let date = Date.now();
      console.log("map ready " + (Date.now() - date));
      console.log("map rendered " + (Date.now() - date));
      store.map.flat().forEach((el, i) => this.addSprite(el, i));
      store.objectsOnMap.forEach(el => this.addObjectOnMap(el));
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
      target.interactive = true;
      target.buttonMode = true;
      // if (!target.isSprite) target.zIndex = store.cellsInLine - i;
      store.gameScene.addChild(target);
      if (target.unclickable) return 0;
      target.on("pointerover", e => {
        let color = 0xff69;

        let filter = new BevelFilter({
          lightColor: color,
          thickness: 5,
          rotation: 0,
          shadowColor: color,
          lightAlpha: 1,
          shadowAlpha: 1,
        });
        if (target.obj) target.obj.sprite.filters = [filter];
        else target.filters = [filter];
      });
      target.on("pointerout", e => {
        target.filters = [];
        if (target.obj) target.obj.sprite.filters = [];
      });
      target.on("pointerup", e => this.clickSprite(target, event));
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
      console.log(target);
      if (target.timeout) return 0;
      let { type } = target;
      if (["forrest", "mountain", "lake"].includes(type)) {
        gsap.to(target.sprite, { alpha: 0.5, duration: 0.5 });
        target.timeout = setTimeout(() => {
          gsap.to(target.sprite, { alpha: 1, duration: 0.5 });
          target.timeout = null;
        }, 2000);
        let count = 4;
        if (type === "forrest") {
          if (this.inventory.includes("axe")) {
            target.mine("axe");
            count = 12;
          }
          this.resources.wood += count;
        }
        if (type === "mountain") {
          if (this.inventory.includes("pickaxe")) {
            target.mine("pickaxe");
            count = 12;
          }
          this.resources.stone += count;
        }
        if (type === "lake") this.resources.food += count;
      }
      if (target.name === "sawmill") {
        if (this.resources.wood / 5 >= 1) {
          await target.obj.shuffle();
          this.resources.desk += Math.floor(this.resources.wood / 5);
          this.resources.wood = this.resources.wood % 5;
          target.obj.alphaCounter("🪵");
        }
      }
      if (target.name === "quarry") {
        if (this.resources.stone / 8 >= 1) {
          await target.obj.shuffle();
          this.resources.steel += Math.floor(this.resources.stone / 8);
          this.resources.stone = this.resources.stone % 8;
          target.obj.alphaCounter("🪨");
        }
      }
      if (target.name === "camp") {
        if (this.resources.food / 3 >= 1) {
          await target.obj.shuffle();
          this.resources.leather += Math.floor(this.resources.food / 3);
          this.resources.food = this.resources.food % 3;
          target.obj.alphaCounter("🍖");
        }
      }
    },
    async addObjectOnMap(el) {
      if (!el.x || !el.y) return 0;
      let container = new Container();
      let sprite = new Sprite(
        store.app.loader.resources[`./assets/${el.name}${el.level}.png`].texture
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
      container.type = el.type;
      container.name = el.name;
      container.shuffle = async function() {
        await gsap.to(this.sprite.scale, { duration: 0.3, x: 0.95, y: 1.05 });
        await gsap.to(this.sprite.scale, { duration: 0.2, x: 1.05, y: 0.95 });
        await gsap.to(this.sprite.scale, { duration: 0.1, x: 1, y: 1 });
      };
      container.alphaCounter = async function(
        text = "+1",
        color = 0xeeeeee,
        delay = 0
      ) {
        let options = {
          fill: color,
          fontFamily: "gothic",
          fontSize: 25,
        };
        if (delay) {
          options = {
            ...options,
            ...{
              align: "center",
              breakWords: true,
              padding: 16,
              trim: true,
              fontSize: 25 - text.length / 5,
              wordWrapWidth: 100,
              stroke: "#333",
              strokeThickness: 4,
            },
          };
        }
        if (/\p{Extended_Pictographic}/u.test(text)) options.fontSize = 55;
        let node = new Text(text, options);
        node.zIndex = 12;
        this.addChild(node);
        node.x = 40;
        if (delay) {
          node.x = 40 - text.length * 1.5;
        }
        node.y = 40;
        await gsap.to(node, { y: 0, alpha: 0, duration: 2, delay });
        this.removeChild(node);
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
      store.gameScene.addChild(container);
      await gsap.to(container, { duration: 0.5, alpha: 1, y });
      console.log(el);
      if (el.advice) {
        console.log(el.advice);
        container.alphaCounter(el.advice);
      }
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
      store.app = app;
      console.log("wowo");

      store.gameScene = new Container();
      store.gameScene.sortableChildren = true;
      store.gameScene.zIndex = 2;
      store.gameScene.x = store.defaultPosX;
      store.gameScene.y = store.defaultPosY;
      store.gameScene.scale.y = 0.8;
      store.gameScene.scale.x = 0.8;
      app.stage.addChild(store.gameScene);
      app.stage.sortableChildren = true;
      app.renderer.backgroundColor = "0x009999";
      app.renderer.autoResize = true;
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
        .add(store.objectsOnMap.map(el => `./assets/${el.name}${el.level}.png`))
        .add("gothic", "./assets/gothic.otf")
        .load(setup);
      console.log(store.app.loader.resources);
      function setup() {
        store.map = initMap("", store, store.allMapCount);
        vm.renderMap();
        enableInteractiveMap(
          document.querySelector("canvas"),
          store.gameScene,
          store
        );
        window.addEventListener("resize", e => {
          app.renderer.resize(window.innerWidth, window.innerHeight);
        });
        document.querySelector("canvas").addEventListener("contextmenu", e => {
          e.preventDefault();
        });
        document.addEventListener(
          "contextmenu",
          e => {
            e.preventDefault();
            e.stopPropagation();
          },
          true
        );
      }
    },
  },
  mounted() {
    this.initPixi();
    store.vue = this;
    console.log("wowo");
  },
};
</script>
