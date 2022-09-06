import {
  Sprite, Container, utils,
  SCALE_MODES,
  Rectangle,
  AnimatedSprite,
  Texture
} from "pixi.js";
import * as PIXI from "pixi.js";
import { store } from "./store";
import { gsap } from "gsap";

function initMap(arr, store, count) {
  let map = [];
  let multiplier = Math.sqrt(count);
  for (let i = 0; i < count; i++) {
    let y = Math.floor(i / multiplier);
    let x = i % multiplier;
    let max = store.center.split("-")[1];
    let spriteName = store.center.split("-")[0];
    let container = new Container();
    if (y < store.unplayableCount) {
      spriteName = store.top.split("-")[0];
      max = store.top.split("-")[1];
    }
    if (y >= multiplier - store.unplayableCount) {
      spriteName = store.bottom.split("-")[0];
      max = store.bottom.split("-")[1];
    }
    if (x < store.unplayableCount) {
      spriteName = store.left.split("-")[0];
      max = store.left.split("-")[1];
    }
    if (x >= multiplier - store.unplayableCount) {
      spriteName = store.right.split("-")[0];
      max = store.right.split("-")[1];
    }
    let random = Math.ceil(Math.random() * max);
    let name = arr[random];
    let sprite;
    sprite = new Sprite(
      store.app.loader.resources[`./assets/${spriteName}${random}.png`].texture
    );
    container.addChild(sprite);
    container.posX = x;
    container.posY = y;
    container.type = spriteName;
    container.sprite = sprite;
    container.mine = async function (name) {
      let sprite = Sprite.from(`./assets/${name}.png`);
      sprite.scale.x = 0.3;
      sprite.scale.y = 0.3;
      sprite.x = 150;
      container.addChild(sprite);
      await gsap.to(sprite, {
        duration: 0.3,
        rotation: 1,
        y: 60,
      });
      await gsap.to(sprite, {
        duration: 0.2,
        alpha: 0,
      });
      container.removeChild(sprite);
    };
    if (i % multiplier === 0) map.push([]);
    map[Math.floor(i / multiplier)].push(container);
  }
  console.log(map);
  return map;
}
function centeringMap(zone, store, options) {
  zone.blocked = true;
  let winHeight = window.innerHeight;
  let winWidth = window.innerWidth;
  let mapHeight = store.groundHeight * zone.scale.y * store.countLines;
  let mapWidth = store.groundWidth * zone.scale.x * store.cellsInLine;
  if (!options)
    options = {
      x:
        Math.abs(store.map[store.countLines - 1][0].x * zone.scale.x) +
        (winWidth - mapWidth) / 2,
      y: -((mapHeight - winHeight) / 3),
    };
  gsap
    .to(zone, {
      duration: 0.5,
      ...options,
    })
    .then(() => (zone.blocked = false));
}
async function enableInteractiveMap(target, zone, store) {
  target.addEventListener("mousewheel", e => {
    if (zone.blocked) return 0;
    let { x, y } = zone.scale;
    let k = 1.02;
    let winHeight = window.innerHeight;
    let winWidth = window.innerWidth;
    let mapHeight = store.groundHeight * zone.scale.y * store.countLines;
    let mapWidth = store.groundWidth * zone.scale.x * store.cellsInLine;
    if (e.deltaY > 0 && x > 0.3) {
      console.log(winHeight, mapHeight);
      if (winHeight > mapHeight - store.groundHeight * store.unplayableCount * 2) return centeringMap(zone, store);
      zone.y +=
        ((store.cellsInLine * (150 - 2)) / 2) * zone.scale.y * (1 - 1 / k);
      zone.scale.x /= k;
      zone.scale.y /= k;
    }
    if (e.deltaY < 0 && x < 1.5) {
      zone.y +=
        ((store.cellsInLine * (150 - 2)) / 2) * zone.scale.y * (1 - 1 * k);
      zone.scale.x *= k;
      zone.scale.y *= k;
    }
    // centerVisibleZone(zone, renderMap);
  });
  target.addEventListener("mousedown", e => {
    zone.dragging = true;
    zone.dragX = e.clientX;
    zone.dragY = e.clientY;
  });
  let tpCache = {};
  target.addEventListener("touchstart", e => {
    if (e.touches.length < 2) {
      e = e.touches[0];
      zone.dragging = true;
      zone.dragX = e.clientX;
      zone.dragY = e.clientY;
      return 0;
    }
    if (e.targetTouches.length >= 2) {
      if (e.targetTouches[0].clientX < e.targetTouches[1].clientX) {
        tpCache.leftFinger = e.targetTouches[0];
        tpCache.rightFinger = e.targetTouches[1];
      } else {
        tpCache.leftFinger = e.targetTouches[1];
        tpCache.rightFinger = e.targetTouches[0];
      }
    }
  });
  target.addEventListener("mousemove", e => {
    if (zone.dragging) {
      let deltaX = zone.dragX - e.clientX;
      let deltaY = zone.dragY - e.clientY;
      if (Math.abs(deltaY) < 2 && Math.abs(deltaX) < 2) return 0;
      zone.x -= deltaX;
      zone.dragX = e.clientX;
      zone.y -= deltaY;
      zone.dragY = e.clientY;
      zone.blockedUI = true;

      // centerVisibleZone(zone, renderMap);
    }
  });
  target.addEventListener("touchmove", e => {
    if (zone.blocked) return 0;
    let { x, y } = zone.scale;
    if (e.targetTouches.length < 2) {
      if (zone.blockedMultitouch) return 0;
      e = e.touches[0];
      if (!zone.dragX || !zone.dragY) {
        zone.dragY = e.clientY;
        zone.dragX = e.clientX;
      }
      let deltaX = zone.dragX - e.clientX;
      let deltaY = zone.dragY - e.clientY;
      if (Math.abs(deltaY) < 2 && Math.abs(deltaX) < 2) return 0;
      zone.x -= deltaX;
      zone.dragX = e.clientX;
      zone.y -= deltaY;
      zone.dragY = e.clientY;
      zone.blockedUI = true;
      // centerVisibleZone(zone, renderMap);
      return 0;
    }
    if (e.touches.length >= 2) {
      let leftFinger =
        e.targetTouches[0].clientX < e.targetTouches[1].clientX
          ? e.targetTouches[0]
          : e.targetTouches[1];
      let rightFinger =
        e.targetTouches[0].clientX < e.targetTouches[1].clientX
          ? e.targetTouches[1]
          : e.targetTouches[0];
      var diff1 = leftFinger.clientX - tpCache.leftFinger.clientX;
      var diff2 = tpCache.rightFinger.clientX - rightFinger.clientX;
      let diff = -(diff1 + diff2);
      let winHeight = window.innerHeight;
      let winWidth = window.innerWidth;
      let mapHeight = store.groundHeight * zone.scale.y * store.countLines;
      let mapWidth = store.groundWidth * zone.scale.x * store.cellsInLine;
      if ((diff > 0 && x < 1.5) || (diff < 0 && x > 0.4)) {
        if (winHeight > mapHeight) return centeringMap(zone, store);
        zone.scale.x += diff / 300;
        zone.scale.y += diff / 300;
        zone.x -= diff;
        zone.y -= diff;
      }
      tpCache.rightFinger = rightFinger;
      tpCache.leftFinger = leftFinger;
      zone.blockedMultitouch = true;
      zone.blockedUI = true;
      // centerVisibleZone(zone, renderMap);
    }
  });
  target.addEventListener("touchend", e => {
    zone.dragging = false;
    zone.dragX = null;
    zone.dragY = null;
    tpCache = {};
    detectOverMap(zone, store);
    setTimeout(() => {
      zone.blockedUI = false;
      zone.blockedMultitouch = false;
    }, 100);
  });
  target.addEventListener("mouseup", e => {
    zone.dragging = false;
    zone.dragX = null;
    zone.dragY = null;
    setTimeout(() => (zone.blockedUI = false), 100);
    detectOverMap(zone, store);
  });
}
function detectOverMap(zone, store) {
  let winHeight = window.innerHeight;
  let winWidth = window.innerWidth;
  let mapHeight = store.groundHeight * zone.scale.y * store.countLines;
  let mapWidth = store.groundWidth * zone.scale.x * store.cellsInLine;
  let left = Math.abs(store.map[store.countLines - 1][0].x * zone.scale.x);
  let right =
    left -
    Math.abs(
      window.innerWidth - store.groundWidth * store.cellsInLine * zone.scale.x
    );
  let top = Math.abs(store.map[0][0].y * zone.scale.y);
  let bottom =
    top -
    Math.abs(
      window.innerHeight - store.groundHeight * store.countLines * zone.scale.y
    );
  if (zone.x > left) centeringMap(zone, store, { x: left });
  if (zone.x < right) centeringMap(zone, store, { x: right });
  if (zone.y > top) centeringMap(zone, store, { y: top });
  if (zone.y < bottom) centeringMap(zone, store, { y: bottom });
  if (mapWidth < winWidth) centeringMap(zone, store);
}
function createAnimatedSprite(src, width, height, count, inLine) {
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
}
export { initMap, enableInteractiveMap, centeringMap, createAnimatedSprite };
