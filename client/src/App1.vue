<template>
  <div class="main_view">
    <div class="container" id="grid" style="padding: 0;position:absolute;top:0">
      <canvas id="canvas" class="border border-dark"></canvas>
    </div>

    <!-- Grid Settings Modal -->
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
  utils,
  SCALE_MODES,
  Rectangle,
  Point,
} from "pixi.js";
import * as PIXI from "pixi.js";
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
import $ from "jquery";
import { Viewport } from "pixi-viewport";
import * as Honeycomb from "honeycomb-grid";
import SimplexNoise from "simplex-noise";
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
    initPixi() {
      const vm = this;
      for (var ii = 1e4, lookupTable = []; ii--; ) {
        lookupTable.push((Math.random() * 101) | 0);
      }
      function lookup() {
        return ++ii >= lookupTable.length
          ? lookupTable[(ii = 0)]
          : lookupTable[ii];
      }
      let loader = new Loader();
      loader
        .add("./assets/tiles/tileset4.png")
        .add("./assets/tiles/tileset3.png")
        .add("./assets/tiles/roads_rivers-tileset.png")
        .load(drawMap);

      function drawMap() {
        let settings = getDefaultSettings();
        // updateSettingsModal(settings);

        let canvas = document.getElementById("canvas");
        let app = new PIXI.Application({
          width: settings.screenW,
          height: settings.screenH,
          backgroundAlpha: false,
          preserveDrawingBuffer: true,
          resolution: devicePixelRatio,
          autoDensity: true,
          view: canvas,
        });
        app.stage.sortableChildren = true;
        app.renderer.autoResize = true;
        document.addEventListener(
          "contextmenu",
          e => {
            e.preventDefault();
            e.stopPropagation();
          },
          true
        );

        const viewport = initializeViewport(app, settings);
        store.gameScene = viewport;
        loadGrid(app, viewport, settings);
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
        socket.emit("choose", { units: ["hero", "hero", "hero"] });
        window.onresize = function() {
          let width =
            window.innerWidth - 1 > 1140 ? 1140 : window.innerWidth - 1;
          let height = window.innerHeight - 1;
          app.renderer.resize(width, height);

          let textureRivers =
            utils.TextureCache["./assets/tiles/roads_rivers-tileset.png"];
          textureRivers.baseTexture.scaleMode = SCALE_MODES.NEAREST;
        };
      }

      function getDefaultSettings() {
        let width = window.innerWidth - 1 > 1140 ? 1140 : window.innerWidth - 1;
        let height = window.innerHeight - 1;
        let colums = 80;
        //  Math.ceil(width / 24) > 47 ? 47 : Math.ceil(width / 24);
        let rows = 30;
        // Math.ceil(height / (16 * 1.73205)) > 20
        //   ? 20
        //   : Math.ceil(height / (16 * 1.73205));

        return {
          screenW: width,
          screenH: height,
          hexSize: 64,
          hexWidth: 128,
          hexHeight: 120,
          hexOrientation: "flat",
          hexColums: colums, // x
          //hexColums: 40, // x
          hexRows: rows, // y
          //hexRows:  20, // y
          lineThickness: 6,
          lineColor: 0x999999,
          hideCoords: true,
          hideGrid: false,
          contourInterval_0: 0.2,
          contourInterval_1: 0.3,
          contourInterval_2: 0.5,
          contourInterval_3: 0.7,
          contourInterval_4: 0.9,
          // Elevation Noise
          elevationSeed: "fdc9a9ca516c78d1f830948badf1875d88424406",
          setElevationSeed: false,
          frequencyElevation: 2,
          redistributionElevation: 1.0,
          elevationOctaves_0: 1,
          elevationOctaves_1: 0.5,
          elevationOctaves_2: 0.25,
          elevationOctaves_3: 0.12,
          createIsland: false,
          // Moisture Noise
          moistureSeed: "d049b358d128cb265740a90fce37904ce07cd653",
          setMoistureSeed: false,
          drawMoisture: true,
          frequencyMoisture: 0.85,
          redistributionMoisture: 1.0,
          moistureOctaves_0: 1,
          moistureOctaves_1: 0.5,
          moistureOctaves_2: 0.25,
          moistureOctaves_3: 0.12,
        };
      }

      function initializeViewport(app, settings) {
        let worldWidth =
          settings.hexColums * (settings.hexSize + settings.hexSize / 2) +
          settings.hexSize / 2;
        let worldHeight =
          settings.hexRows * (settings.hexSize * 1.73205) +
          (settings.hexSize * 1.73205) / 2;
        if (settings.hexOrientation === "pointy") {
          worldWidth =
            settings.hexColums * (settings.hexSize * 1.73205) +
            (settings.hexSize * 1.73205) / 2;
          worldHeight =
            settings.hexRows * (settings.hexSize + settings.hexSize / 2) +
            settings.hexSize / 2;
        }

        const viewport = new Viewport({
          screenWidth: app.view.offsetWidth,
          screenHeight: app.view.offsetHeight,
          worldWidth: worldWidth,
          worldHeight: worldHeight,

          interaction: app.renderer.plugins.interaction, // the interaction module is important for wheel to work properly when renderer.view is placed or scaled
        });

        app.stage.addChild(viewport);

        viewport
          .drag()
          .wheel()
          .pinch()
          .decelerate()
          .bounce();

        return viewport;
      }

      function loadGrid(app, viewport, settings) {
        if (!$("#setMapHash").is(":checked"))
          $("#mapHash").val(btoa(JSON.stringify(settings)));
        let Hex = Honeycomb.extendHex({
          size: { width: 128, height: 109 },
          orientation: settings.hexOrientation,
        });
        let Grid = Honeycomb.defineGrid(Hex);
        let elevation = heightMap(settings);
        let moisture = moistureMap(settings);

        let biomeTileset = {
          DeepWater: { x: 4, y: 5, z: 0 },
          ShallowWater: { x: 0, y: 5, z: 1 },
          FlatDesert1: { x: 1, y: 2, z: 2 },
          FlatDesert2: { x: 1, y: 1, z: 2 },
          FlatGrass: { x: 2, y: 0, z: 2 },
          FlatSparseTrees1: { x: 3, y: 0, z: 2 },
          FlatSparseTrees2: { x: 4, y: 0, z: 2 },
          FlatForest: { x: 5, y: 0, z: 2 },
          FlatForestSwampy: { x: 7, y: 1, z: 2 },
          HillDesert: { x: 9, y: 2, z: 3 },
          HillGrass: { x: 7, y: 0, z: 3 },
          HillForest: { x: 6, y: 0, z: 3 },
          HillForestNeedleleaf: { x: 10, y: 0, z: 3 },
          MountainDesert: { x: 8, y: 2, z: 4 },
          MountainShrubland1: { x: 8, y: 0, z: 4 },
          MountainShrubland2: { x: 9, y: 0, z: 4 },
          MountainAlpine1: { x: 10, y: 0, z: 4 },
          MountainAlpine2: { x: 11, y: 0, z: 4 },
          MountainImpassable1: { x: 10, y: 6, z: 5 },
          MountainImpassable2: { x: 0, y: 6, z: 5 },
          lake1: { x: 12, y: 0, z: 0 },
          lake2: { x: 3, y: 1, z: 0 },
          lake3: { x: 2, y: 1, z: 0 },
          lake4: { x: 8, y: 1, z: 0 },
          Volcano: { x: 3, y: 6, z: 5 },
          lair: { x: 0, y: 8 },
          lairSnow: { x: 1, y: 8 },
          lairDesert: { x: 2, y: 8 },
        };

        let riverTileset = {
          SOURCE: { x: 0, y: 2 },
          "01": { x: 1, y: 1 },
          "02": { x: 5, y: 2 },
          "03": { x: 2, y: 2 },
          "04": { x: 2, y: 1 },
          "05": { x: 4, y: 2 },
          "10": { x: 1, y: 1 },
          "12": { x: 4, y: 1 },
          "13": { x: 6, y: 1 },
          "14": { x: 3, y: 1 },
          "15": { x: 0, y: 1 },
          "20": { x: 5, y: 2 },
          "21": { x: 4, y: 1 },
          "23": { x: 3, y: 2 },
          "24": { x: 5, y: 1 },
          "25": { x: 1, y: 2 },
          "30": { x: 2, y: 2 },
          "31": { x: 6, y: 1 },
          "32": { x: 3, y: 2 },
          "34": { x: 7, y: 1 },
          "35": { x: 6, y: 2 },
          "40": { x: 2, y: 1 },
          "41": { x: 3, y: 1 },
          "42": { x: 5, y: 1 },
          "43": { x: 7, y: 1 },
          "45": { x: 7, y: 2 },
          "50": { x: 4, y: 2 },
          "51": { x: 0, y: 1 },
          "52": { x: 1, y: 2 },
          "53": { x: 6, y: 2 },
          "54": { x: 7, y: 2 },
        };

        // render hex grid
        let gr = Grid.rectangle({
          width: settings.hexColums,
          height: settings.hexRows,
        });
        store.map = gr;
        gr.forEach(hex => {
          let coords = hex.cartesian();
          hex.elevation = elevation[coords.x][coords.y];
          hex.moisture = moisture[coords.x][coords.y];
          if (
            coords.x > 25 &&
            coords.x < settings.hexColums - 25 &&
            coords.y > 5 &&
            coords.y < settings.hexRows - 5
          ) {
            hex.archetype = "Flat";
            if (hex.moisture < 0.1) {
              hex.biome = "Desert";
              hex.tile = "FlatDesert1";
            } else if (hex.moisture < 0.25) {
              hex.biome = "Desert";
              hex.tile = "FlatDesert2";
            } else {
              hex.biome = "Grass";
              hex.tile = "FlatGrass";
            }
            return 0;
          }

          if (hex.elevation < settings.contourInterval_0) {
            hex.archetype = "Deep Water";
            hex.biome = "Water";
            hex.tile = "DeepWater";
          } else if (hex.elevation < settings.contourInterval_1) {
            hex.archetype = "Shallow Water";
            hex.biome = "Water";
            hex.tile = "ShallowWater";
          } else if (hex.elevation < settings.contourInterval_2) {
            hex.archetype = "Flat";
            if (hex.moisture < 0.1) {
              hex.biome = "Desert";
              hex.tile = "FlatDesert1";
            } else if (hex.moisture < 0.25) {
              hex.biome = "Desert";
              hex.tile = "FlatDesert2";
            } else if (hex.moisture < 0.4) {
              hex.biome = "Grass";
              hex.tile = "FlatGrass";
            } else if (hex.moisture < 0.65) {
              hex.biome = "Grass";
              hex.tile =
                lookup() <= 10 ? "FlatSparseTrees2" : "FlatSparseTrees1";
            } else if (hex.moisture < 0.95) {
              hex.biome = "Forest";
              hex.tile = "FlatForest";
            } else {
              hex.biome = "Forest";
              hex.tile = "FlatForestSwampy";
            }
          } else if (hex.elevation < settings.contourInterval_3) {
            hex.archetype = "Hill";
            if (hex.moisture < 0.1) {
              hex.biome = "Desert";
              hex.tile = "HillDesert";
            } else if (hex.moisture < 0.45) {
              hex.biome = "Grass";
              hex.tile = "HillGrass";
            } else {
              hex.biome = "Forest";
              hex.tile = "HillForest";
            }
          } else if (hex.elevation < settings.contourInterval_4) {
            hex.archetype = "Mountain";
            if (hex.moisture < 0.1) {
              hex.biome = "Desert";
              hex.tile = "MountainDesert";
            } else if (hex.moisture < 0.3) {
              hex.biome = "Shrubland";
              hex.tile =
                lookup() <= 50 ? "MountainShrubland2" : "MountainShrubland1";
            } else if (hex.moisture < 0.8) {
              hex.biome = "Alpine forest";
              hex.tile = lookup() <= 50 ? "MountainAlpine2" : "MountainAlpine1";
            } else {
              hex.biome = "Shrubland";
              hex.tile =
                lookup() <= 50 ? "MountainShrubland2" : "MountainShrubland1";
            }
          } else {
            hex.archetype = "Mountain impassable";
            hex.biome = "Snow";
            if (hex.moisture < 0.4) {
              hex.tile = lookup() >= 97 ? "Volcano" : "MountainImpassable1";
            } else {
              hex.tile = "MountainImpassable2";
            }
          }
        });
        gr.forEach(hex => {
          if (hex.tile === "ShallowWater") {
            let hexesInRange = gr.neighborsOf(hex);
            let terrainSorrounded = true;
            let counter = 0;
            for (let i = 0; i < hexesInRange.length; i++) {
              let hexToCheck = hexesInRange[i];
              if (hexToCheck === undefined || hexToCheck.tile === "DeepWater") {
                terrainSorrounded = false;
                break;
              } else if (
                hexToCheck !== undefined &&
                hexToCheck.tile === "ShallowWater"
              ) {
                counter++;
              }
            }
            if (terrainSorrounded && counter < 2) {
              //if (terrainSorrounded && counter < 1) {
              //hex.tile = lookup() <= 50 ? "lake2": "lake3";
              if (counter === 0) hex.tile = lookup() <= 50 ? "lake2" : "lake1";
              else if (counter === 1)
                hex.tile = lookup() <= 50 ? "lake4" : "lake3";
            }
          }
        });

        let texture = utils.TextureCache["./assets/tiles/tileset4.png"];
        if (settings.hideGrid)
          texture = utils.TextureCache["./assets/tiles/tileset4.png"];
        texture.baseTexture.scaleMode = SCALE_MODES.NEAREST;

        for (let y = 0; y < settings.hexRows; y++) {
          for (let x = 0; x < settings.hexColums; x = x + 2) {
            let hex = gr.get([x, y]);
            let tileCoords = biomeTileset[hex.tile];
            if (!tileCoords) continue;

            texture.frame = new Rectangle(
              tileCoords.x * settings.hexWidth,
              tileCoords.y * settings.hexWidth * 1.5,
              settings.hexWidth,
              settings.hexWidth * 1.5
            );
            let fantasyHexTile = new Sprite(
              new Texture(texture.baseTexture, texture.frame)
            );

            hex.ground = fantasyHexTile;
            fantasyHexTile.x = x * (settings.hexWidth * 0.75);
            fantasyHexTile.y =
              -(settings.hexHeight * 0.6) + y * (settings.hexHeight * 0.9);
            viewport.addChild(fantasyHexTile);

            // Lair
            if (
              hex.biome !== "water" &&
              (hex.biome === "Forest" ||
                hex.archetype === "hill" ||
                hex.biome === "Snow" ||
                hex.archetype === "Mountain")
            ) {
              if (lookup() <= 3) {
                hex.lair = "lair";
                if (hex.biome === "Desert") hex.lair = "lairDesert";
                if (hex.tile === "MountainImpassable2") hex.lair = "lairSnow";
                tileCoords = biomeTileset[hex.lair];
                if (!tileCoords) continue;
                texture.frame = new Rectangle(
                  tileCoords.x * settings.hexWidth,
                  tileCoords.y * settings.hexWidth * 1.5,
                  settings.hexWidth,
                  settings.hexHeight
                );
                let lairHexTile = new Sprite(
                  new Texture(texture.baseTexture, texture.frame)
                );
                lairHexTile.x = x * (settings.hexWidth * 0.75);
                lairHexTile.y =
                  -(settings.hexHeight * 0.6) + y * (settings.hexHeight * 0.9);
                viewport.addChild(lairHexTile);
              }
            }
          }
          for (let x = 1; x < settings.hexColums; x = x + 2) {
            let hex = gr.get([x, y]);
            let tileCoords = biomeTileset[hex.tile];
            if (!tileCoords) continue;
            texture.frame = new Rectangle(
              tileCoords.x * settings.hexWidth,
              tileCoords.y * settings.hexWidth * 1.5,
              settings.hexWidth,
              settings.hexWidth * 1.5
            );
            let fantasyHexTile = new Sprite(
              new Texture(texture.baseTexture, texture.frame)
            );
            fantasyHexTile.x = x * (settings.hexWidth * 0.75);
            fantasyHexTile.y =
              -(settings.hexWidth / 8) + y * (settings.hexHeight * 0.9);
            hex.ground = fantasyHexTile;
            viewport.addChild(fantasyHexTile);

            // Lair
            if (
              hex.biome !== "water" &&
              (hex.biome === "Forest" ||
                hex.biome === "Snow" ||
                hex.archetype === "Mountain")
            ) {
              if (lookup() <= 3) {
                hex.lair = "lair";
                if (hex.biome === "Desert") hex.lair = "lairDesert";
                if (hex.tile === "MountainImpassable2") hex.lair = "lairSnow";
                tileCoords = biomeTileset[hex.lair];
                if (!tileCoords) continue;
                texture.frame = new Rectangle(
                  tileCoords.x * settings.hexWidth,
                  tileCoords.y * settings.hexWidth * 1.5,
                  settings.hexWidth,
                  settings.hexHeight
                );
                let lairHexTile = new Sprite(
                  new Texture(texture.baseTexture, texture.frame)
                );
                lairHexTile.x = x * (settings.hexWidth * 0.75);
                lairHexTile.y =
                  -(settings.hexWidth / 8) + y * (settings.hexHeight * 0.9);
                viewport.addChild(lairHexTile);
              }
            }
          }
        }

        let textureRivers =
          utils.TextureCache["./assets/tiles/roads_rivers-tileset.png"];
        textureRivers.baseTexture.scaleMode = SCALE_MODES.NEAREST;

        // River sources
        let riverSources = [];
        gr.forEach(hex => {
          if (
            hex.biome === "Water" ||
            hex.tile === "Volcano" ||
            hex.archetype === "Flat"
          )
            return;
          if (
            hex.moisture < 0.6 &&
            hex.archetype !== "Mountain impassable" &&
            hex.biome !== "Alpine forest"
          )
            return;

          hex.source = false;
          if (hex.archetype === "Hill" && lookup() <= 6) {
            hex.source = true;
          } else if (hex.archetype === "Mountain" && lookup() <= 10) {
            hex.source = true;
          } else if (
            hex.archetype === "Mountain impassable" &&
            hex.moisture < 0.4 &&
            lookup() <= 15
          ) {
            // Mountain impassable
            hex.source = true;
          } else if (
            hex.archetype === "Mountain impassable" &&
            hex.moisture >= 0.4 &&
            lookup() <= 34
          ) {
            // Mountain impassable
            hex.source = true;
          }
          if (!hex.source) return;

          let hexesInRange = gr.neighborsOf(hex);
          for (let i = 0; i < hexesInRange.length; i++) {
            let hexToCheck = hexesInRange[i];
            if (
              !hexToCheck ||
              hexToCheck.biome === "Water" ||
              hexToCheck.source === true
            ) {
              hex.source = false;
              break;
            }
          }
          if (hex.source) {
            hex.riverId = hex.x + "," + hex.y;
            riverSources.push(hex);
          }
        });

        riverSources.forEach(hex => {
          hex.river = "SOURCE";
          hex.riverEnd = false;

          drawRiver(hex);
        });

        function drawRiver(hex) {
          if (hex.riverEnd === true) {
            //console.log('----------- End River -----------');
            return;
          }

          let hexesInRange = gr.neighborsOf(hex);
          let hexDestination = null;
          for (let i = 0; i < hexesInRange.length; i++) {
            let hexToCheck = hexesInRange[i];

            if (
              typeof hexToCheck !== "undefined" &&
              (hexToCheck.tile === "ShallowWater" ||
                hexToCheck.tile === "DeepWater" ||
                hexToCheck.tile.includes("lake"))
            ) {
              hex.sideRiverExit = i;
              hex.riverEnd = true;
              hexDestination = null;
              hex.river = null;
              break;
            } else if (typeof hexToCheck === "undefined") {
              hex.sideRiverExit = i;
              hex.riverEnd = true;
              hexDestination = null;
              hex.river = null;
              break;
            }

            // Different riverId to avoid cicles.
            if (hexToCheck.riverId === hex.riverId) continue;
            if (hexToCheck.riverId && hexToCheck.source === true) continue;
            // No Volcano cross
            if (hexToCheck.tile === "Volcano") continue;
            //No go north or south impassable
            if (i === 4 && biomeTileset[hex.tile].z === 5) continue;
            if (
              i === 1 &&
              biomeTileset[hexToCheck.tile].z === 5 &&
              biomeTileset[hex.tile].z === 5
            )
              continue;
            if (hexToCheck.x === settings.hexColums - 1 && hex.source === true)
              continue;
            if (hexToCheck.y === settings.hexRows - 1 && hex.source === true)
              continue;

            if (!hexDestination) {
              hexDestination = hexToCheck;
            }
            // If there is a inferior archetype, choose as destination
            else if (
              biomeTileset[hexToCheck.tile].z <
              biomeTileset[hexDestination.tile].z
            ) {
              hexDestination = hexToCheck;
            }
            // The source runs to the most moisture hex.
            else if (
              hex.source === true &&
              biomeTileset[hexToCheck.tile].z ===
                biomeTileset[hexDestination.tile].z &&
              hexToCheck.moisture > hexDestination.moisture
            ) {
              hexDestination = hexToCheck;
            } else if (
              hex.source !== true &&
              biomeTileset[hexToCheck.tile].z ===
                biomeTileset[hexDestination.tile].z &&
              hexToCheck.elevation < hexDestination.elevation
            ) {
              hexDestination = hexToCheck;
            }
          }

          if (hexDestination) {
            if (hex.source === true) {
              hexDestination.sourceSon = true;
            }

            let indexHex = hexesInRange.indexOf(hexDestination);
            hex.sideRiverExit = indexHex;
            hexDestination.sideRiverEnter =
              indexHex > 2 ? indexHex - 3 : indexHex + 3;
            if (
              hexDestination.tile === "ShallowWater" ||
              hexDestination.tile === "DeepWater" ||
              (hexDestination.tile.includes("lake") &&
                hexDestination.archetype !== "flat")
            ) {
              hexDestination.riverEnd = true;
            } else if (
              hexDestination.tile.includes("lake") &&
              hexDestination.archetype === "flat"
            ) {
              //nada
            } else if (
              hexDestination.riverId &&
              hex.riverId !== hexDestination.riverId &&
              hexDestination.source !== true
            ) {
              hex.riverJoin = true;
            } else {
              hexDestination.riverId = hex.riverId;
            }
          }

          if (hex.riverJoin === true) {
            drawRiverTile(hex);
            drawRiverTile(hexDestination);
            return;
          } else if (hex.sourceSon === true && hex.riverEnd === true) {
            // don't draw rivers of 1 hex length
            return;
          } else if (
            hex.river !== "SOURCE" &&
            !(hex.sourceSon === true && hex.riverEnd === true)
          ) {
            drawRiverTile(hex);
          }

          if (hexDestination) return drawRiver(hexDestination);
        }

        function drawRiverTile(hex) {
          let river = null;
          if (
            typeof hex.sideRiverEnter !== "undefined" &&
            typeof hex.sideRiverExit !== "undefined"
          )
            river = hex.sideRiverEnter + "" + hex.sideRiverExit;
          if (!river) return;
          let tileCoords = riverTileset[river];
          if (!tileCoords) return;

          textureRivers.frame = new Rectangle(
            tileCoords.x * 32,
            tileCoords.y * 48,
            32,
            48
          );
          let riverSource = new Sprite(
            new Texture(textureRivers.baseTexture, textureRivers.frame)
          );

          if (hex.x % 2 === 1) {
            riverSource.x = hex.x * 24;
            riverSource.y = -4 + hex.y * 28;
          } else {
            riverSource.x = hex.x * 24;
            riverSource.y = -18 + hex.y * 28;
          }

          viewport.addChild(riverSource);
        }

        function onClick(event) {
          const hexCoordinates = Grid.pointToHex(event.world.x, event.world.y);
          if (!gr.get(hexCoordinates)) return;

          let hex = gr.get(hexCoordinates);
          console.log(hex);
          gr.neighborsOf(hex).forEach(hex => {
            hex.ground.filters = [new ColorOverlayFilter(0xaabbcc, 0.3)];
          });
        }

        viewport.on("clicked", onClick);
        viewport.on("pointermove", e => {
          let point = viewport.toWorld(e.data.global);
          let hex = gr.get(Grid.pointToHex(point.x, point.y));
          hex.ground.alpha = 0.8;
          gr.neighborsOf(hex).forEach(hex => (hex.ground.alpha = 1));
        });

        if (settings.hideCoords === true) return;

        gr.forEach(hex => {
          const point = hex.toPoint();
          const centerPosition = hex.center().add(point);
          const coordinates = hex.coordinates();

          let fontSize = 12;
          if (settings.hexSize < 15) fontSize = settings.hexSize / 1.5;

          let text = new Text(coordinates.x + "," + coordinates.y, {
            fontFamily: "Arial",
            fontSize: fontSize,
            fill: 0x000000,
            align: "center",
          });

          text.x = centerPosition.x;
          text.y = centerPosition.y;
          text.anchor.set(0.5);

          viewport.addChild(text);
        });
      }

      function heightMap(settings) {
        const simplex = new SimplexNoise(settings.elevationSeed);
        let elevation = [[]];
        let freq = settings.frequencyElevation; // increase has a zoom out effect, decrease for zoom in
        for (let x = 0; x < settings.hexColums; x++) {
          elevation[x] = [];
          for (let y = 0; y < settings.hexRows; y++) {
            let nx = (x / settings.hexColums) * freq;
            let ny = (y / settings.hexRows) * freq;

            let e =
              settings.elevationOctaves_0 * simplex.noise2D(nx, ny) +
              settings.elevationOctaves_1 * simplex.noise2D(4 * nx, 4 * ny) +
              settings.elevationOctaves_2 * simplex.noise2D(8 * nx, 8 * ny) +
              settings.elevationOctaves_3 * simplex.noise2D(16 * nx, 16 * ny);
            e = (e + 1) / 2; // from -1 to 1  --> from 0 to 1

            if (settings.createIsland) {
              let xp = x / settings.hexColums;
              let yp = y / settings.hexRows;
              let d = Math.hypot(0.5 - xp, 0.5 - yp);
              e = (1 + e - d * 3.5) / 2;
            }

            if (e < 0) e = 0;
            if (e > 1) e = 1;

            elevation[x][y] = Math.pow(e, settings.redistributionElevation);
          }
        }

        return elevation;
      }

      function moistureMap(settings) {
        const simplex = new SimplexNoise(settings.moistureSeed);
        let moisture = [[]];
        let freq = settings.frequencyMoisture; // increase has a zoom out effect, decrease for zoom in
        for (let x = 0; x < settings.hexColums; x++) {
          moisture[x] = [];
          for (let y = 0; y < settings.hexRows; y++) {
            let nx = (x / settings.hexColums) * freq;
            let ny = (y / settings.hexRows) * freq;

            let m =
              settings.moistureOctaves_0 * simplex.noise2D(nx, ny) +
              settings.moistureOctaves_1 * simplex.noise2D(4 * nx, 4 * ny) +
              settings.moistureOctaves_2 * simplex.noise2D(8 * nx, 8 * ny) +
              settings.moistureOctaves_3 * simplex.noise2D(16 * nx, 16 * ny);
            m = (m + 1) / 2; // from -1 to 1  --> from 0 to 1
            if (m < 0) m = 0;
            if (m > 1) m = 1;
            moisture[x][y] = Math.pow(m, settings.redistributionMoisture);
          }
        }

        return moisture;
      }

      function dec2hex(dec) {
        return ("0" + dec.toString(16)).substr(-2);
      }

      // generateId :: Integer -> String
      function generateId(len) {
        let arr = new Uint8Array((len || 40) / 2);
        window.crypto.getRandomValues(arr);
        return Array.from(arr, dec2hex).join("");
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
      let ground = store.map.get([x, y]);
      console.log(ground);
      container.ground = ground;
      ground.unit = container;
      container.x = ground.ground.x + 20;
      container.y = ground.ground.y + 60;
      container.scale.x = 0.25;
      container.scale.y = 0.25;
      container.posX = x;
      container.posY = y;
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
  },
  async mounted() {
    this.initPixi();
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
.modal {
  position: absolute;
  display: none;
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
