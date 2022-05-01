import { Sprite, Container, Polygon, AnimatedSprite, Texture } from "pixi.js";

function initMap(arr, store, count) {
  let map = [];
  let multiplier = Math.sqrt(count);
  for (let i = 0; i < count; i++) {
    let y = Math.floor(i / multiplier);
    let x = i % multiplier;
    let random = Math.ceil(Math.random() * 7 - 1);
    let sprite = Sprite.from(`./assets/Grass/${1}.png`);
    let container = new Container();
    container.addChild(sprite);
    container.posX = x;
    container.posY = y;
    container.tileMap = true;
    container.spriteMap = sprite;
    Object.defineProperty(container, "tint", {
      get() {
        return sprite.tint;
      },
      set(value) {
        sprite.tint = value;
      },
    });
    if (i % multiplier === 0) map.push([]);
    map[Math.floor(i / multiplier)].push(container);
  }
  return map;
}
async function renderMap(store, handler) {
  store.gameScene.children.forEach(el => store.gameScene.removeChild(el));
  store.visibleZone = [];
  let y = 0;
  let x = 0;
  let endLines = store.y + store.countLines;
  let lines = store.map.slice(y, endLines);
  lines.forEach((el, i) => {
    let line = [...el];
    let endLine = store.x + store.cellsInLine;
    if (store.x < x) count = Math.abs(x - store.x);
    line = line.slice(x, endLine);
    line.forEach(cell => store.visibleZone.push(cell));
  });
  store.gameScene.children.forEach(el => store.gameScene.removeChild(el));
  store.visibleZone.forEach((el, i) =>
    store.gameScene.addChild(setGround(el, i, store.cellsInLine, handler))
  );
  renderTrees(store);
}
function setGround(target, i, cellsInLine, handler) {
  let y = Math.ceil(i / cellsInLine);
  let x = i % cellsInLine;
  let multiplier = 0;
  if (y % 2 === 0) multiplier = 84;
  target.x = x * 168 + multiplier;
  target.y = y * 138;
  target.interactive = true;
  target.buttonMode = true;
  if (target.unclickable) return 0;
  target.on("pointerover", e => {
    target.alpha = 0.9;
  });
  target.on("pointerout", e => {
    target.alpha = 1;
  });
  target.on("pointerup", e => handler(target, event));
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
  return target;
}
function renderTrees(store) {
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
}
async function enableInteractiveMap(target, zone, renderMap, vue) {
  document.addEventListener(
    "contextmenu",
    e => {
      e.preventDefault();
      e.stopPropagation();
    },
    true
  );
  target.addEventListener("mousewheel", e => {
    let { x, y } = zone.scale;
    let k = 1.02;
    let m = 20;
    if (e.deltaY > 0 && x > 0.3) {
      zone.scale.x /= k;
      zone.scale.y /= k;
      zone.x += m;
      zone.y += m;
    }
    if (e.deltaY < 0 && x < 1.5) {
      zone.scale.x *= k;
      zone.scale.y *= k;
      zone.x -= m;
      zone.y -= m;
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
      console.log("multitouch");
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

      if ((diff > 0 && x < 1.5) || (diff < 0 && x > 0.4)) {
        zone.scale.x += diff / 300;
        zone.scale.y += diff / 300;
        zone.x += diff / 3;
        zone.y += diff / 3;
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
  });
}

export { initMap, enableInteractiveMap, renderMap };
