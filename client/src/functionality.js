import { Sprite, Text, Container, Point, Graphics } from "pixi.js";
import { DropShadowFilter } from "@pixi/filter-drop-shadow";
import { BevelFilter } from "@pixi/filter-bevel";
import { gsap } from "gsap";
import { store } from "./store";
function createJoystic({ x = 0, y = 0, angle = 0 }, handler) {
  let joystick = Sprite.from("./assets/joystic.png");
  let joyContainer = new Container();
  joyContainer.sortableChildren = true;
  joyContainer.x = x;
  joyContainer.zIndex = 3;
  joyContainer.angle = angle;
  joyContainer.y = y;
  joyContainer.interactive = true;
  joyContainer.buttonMode = true;
  joystick.alpha = 1;
  joystick.zIndex = 2;
  joyContainer.scale.y = 0.5 / window.devicePixelRatio;
  joyContainer.scale.x = 0.5 / window.devicePixelRatio;
  joyContainer.on("pointerover", e => {
    gsap.to(joystick.scale, {
      x: joystick.scale.x + 0.03,
      y: joystick.scale.y + 0.03,
      duration: 0.3,
    });
  });
  joyContainer.on("pointerout", e => {
    gsap.to(joystick.scale, {
      x: joystick.scale.x - 0.03,
      y: joystick.scale.y - 0.03,
      duration: 0.3,
    });
  });
  joyContainer.on("pointerdown", () => {
    handler();
    joystick.interval = setInterval(() => handler(), 150);
  });
  joyContainer.on("pointerup", () => clearInterval(joystick.interval));
  joyContainer.addChild(joystick);
  return joyContainer;
}
function getMontain(frames, store, id) {
  let names = Object.keys(frames);
  let container = new Container();
  let sprite = Sprite.from("./assets/sWall005.png");
  let random = Math.ceil(Math.random() * names.length - 1);
  let name = names[random];
  let mountain = new Sprite(store[name]);
  mountain.width = 200;
  mountain.height = 150;
  sprite.width = 256;
  container.height = 150;
  container.width = 256;
  mountain.x = 1;
  mountain.y = -70;
  container.addChild(sprite);
  container.addChild(mountain);
  container.unclickable = true;
  container.sortableChildren = true;
  container.zIndex = 1;
  return container;
}
function getJoystics(store, renderMap) {
  let joystics = [
    createJoystic({ x: window.innerWidth / 2, y: 0, angle: 90 }, () => {
      if (store.x > -10) store.x--;
      if (store.y > -10) store.y--;
      renderMap();
    }),
    createJoystic(
      { x: window.innerWidth / 2 - 50, y: window.innerHeight, angle: -90 },
      () => {
        store.x++;
        store.y++;
        renderMap();
      }
    ),
    createJoystic({ x: 0, y: window.innerHeight / 2 - 50, angle: 0 }, () => {
      store.y++;
      if (store.x > -10) store.x--;
      renderMap();
    }),
    createJoystic(
      { x: window.innerWidth, y: window.innerHeight / 2, angle: 180 },
      () => {
        if (store.y > -10) store.y--;
        store.x++;
        renderMap();
      }
    ),
    createJoystic({ x: window.innerWidth, y: 40, angle: 135 }, () => {
      if (store.y > -10) store.y--;
      renderMap();
    }),
    createJoystic({ x: 0, y: window.innerHeight - 40, angle: -45 }, () => {
      store.y++;
      renderMap();
    }),
    createJoystic({ x: 40, y: -5, angle: 45 }, () => {
      if (store.x > -10) store.x--;
      renderMap();
    }),
    createJoystic(
      { x: window.innerWidth - 40, y: window.innerHeight, angle: 225 },
      () => {
        store.x++;
        renderMap();
      }
    ),
  ];
  return joystics;
}

function initMap(arr, store, count) {
  let map = [];
  let multiplier = Math.sqrt(count);
  for (let i = 0; i < count; i++) {
    let y = Math.floor(i / multiplier);
    let x = i % multiplier;
    let random = Math.ceil(Math.random() * 8 - 1);
    if (!random) random = 1;
    if (x > 5 && x < 25 && y > 5 && y < 25) random = 1;
    if (y < 5 && Math.random() > 0.2) random = 3;
    if (y >= 25 && Math.random() > 0.2) random = 6;
    let sprite = Sprite.from(`./assets/Grass/${random}.png`);
    sprite.posX = x;
    sprite.posY = y;
    if (i % multiplier === 0) map.push([]);
    map[Math.floor(i / multiplier)].push(sprite);
  }
  return map;
}
async function sortUnit(unit, activeUnit, zone, container) {
  let ground = zone.find(gr => gr.posX === unit.posX && gr.posY === unit.posY);
  if (ground) {
    let x = unit.diffX || 60;
    let y = unit.diffY || -10;
    unit.x = ground.x + x;
    unit.y = ground.y + y;
    unit.zIndex = unit.posX + unit.posY;
    container.addChild(unit);
    unit.visible = true;
    if (!unit.ground) setUnit(unit, ground, false, "unit");
  } else {
    unit.visible = false;
    container.removeChild(unit);
  }
}
function isAvailableMove(unit, target) {
  if (!unit || !target) return false;
  if (unit.unit && unit.unit.monster) return true;
  let multiX = Math.abs(unit.posX - target.posX);
  let multiY = Math.abs(unit.posY - target.posY);
  let available = 1;
  if (unit.ground && unit.ground.type === "garage") available += 3;
  if (multiX > available || multiY > available) return false;
  else return true;
}
function isAvailableAttack(unit, target) {
  if (!unit || !target || !unit.unit) return false;
  let radius = unit.unit.fire_radius;
  let available = isNaN(radius) ? 1 : radius;
  available++;
  let diffX = Math.abs(unit.posX - target.posX);
  let diffY = Math.abs(unit.posY - target.posY);
  if (diffX > available || diffY > available) return false;
  else return true;
}
function centerVisibleZone(zone, renderMap) {
  let needRender = false;

  let newCellsInLine = Math.floor(
    ((window.innerWidth / zone.scale.x) * 1.5) / ((256 - 2) / 2)
  );
  let cellsToUpdate = Math.max(2, Math.floor(newCellsInLine / 8));
  if (Math.abs(store.cellsInLine - newCellsInLine) > cellsToUpdate * 2) {
    store.cellsInLine = newCellsInLine;
    store.countLines = store.cellsInLine;
    needRender = true;
  }

  let dx = ((256 - 2) / 2) * zone.scale.x;
  let dy = ((150 - 2) / 2) * zone.scale.y;

  let centerX = window.innerWidth / 2;
  let centerY = window.innerHeight / 2 - dy * store.cellsInLine + dy * 3;

  if (
    Math.abs(zone.x - centerX) > dx * cellsToUpdate ||
    Math.abs(zone.y - centerY) > dy * cellsToUpdate
  ) {
    needRender = true;
  }
  if (needRender) {
    let n = Math.round(((zone.x - centerX) / dx + (zone.y - centerY) / dy) / 2);
    let m = Math.round(
      (-(zone.x - centerX) / dx + (zone.y - centerY) / dy) / 2
    );
    store.x -= n;
    store.y -= m;
    zone.x += -dx * n + dx * m;
    zone.y += -dy * n - dy * m;

    renderMap();
  }
}
async function enableInteractiveMap(target, zone, renderMap, vue) {
  target.addEventListener("mousewheel", e => {
    let { x, y } = zone.scale;
    let k = 1.02;
    if (e.deltaY > 0 && x > 0.3) {
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

      if ((diff > 0 && x < 1.5) || (diff < 0 && x > 0.4)) {
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
async function moveUnit(unit, ground) {
  unit.unit.direction = getDirection(unit.ground, ground);
  unit.ground.filters = [];
  unit.ground.unit = null;
  if (unit.active) {
    ground.filters = [
      new BevelFilter({
        lightColor: 0xff69,
        thickness: 15,
        rotation: 0,
        shadowColor: 0xff69,
        lightAlpha: 1,
        shadowAlpha: 1,
      }),
    ];
  }
  unit.ground = ground;
  ground.unit = unit;
  unit.posX = ground.posX;
  unit.posY = ground.posY;
  unit.zIndex = unit.posX + unit.posY;
  unit.alpha = 1;
  window.sound("go");
  let x = unit.diffX || Math.abs(ground.width - unit.unit.width) / 2.5;
  let y = unit.diffY || -Math.abs(ground.height - unit.unit.height) * 2.5;
  await gsap.to(unit, {
    x: ground.x + x,
    y: ground.y + y,
    duration: 0.5,
    ease: "back.inOut(1)",
  });
  // unit.lockedTime = Date.now() + 10000;
  return true;
}
async function moveCircle(circle, ground, duration = 0.5) {
  circle.x = ground.x + 20;
  circle.y = ground.y + 35;
}
async function updateText(container, textNode, text) {
  container.removeChild(textNode.text);
  textNode.text = new Text(`${text}`, {
    fontSize: 30,
    fontFamily: "metalwar",
    fill: 0xffffff,
  });
  textNode.text.zIndex = 3;
  container.addChild(textNode.text);
}
function getDirection(fromPlace = {}, toPlace = {}) {
  if (fromPlace.x > toPlace.x && fromPlace.y == toPlace.y) return "l";
  if (fromPlace.x < toPlace.x && fromPlace.y == toPlace.y) return "r";
  if (fromPlace.y > toPlace.y && fromPlace.x == toPlace.x) return "u";
  if (fromPlace.y < toPlace.y && fromPlace.x == toPlace.x) return "d";

  if (fromPlace.x > toPlace.x && fromPlace.y > toPlace.y) return "ul";
  if (fromPlace.x < toPlace.x && fromPlace.y < toPlace.y) return "dr";
  if (fromPlace.x < toPlace.x && fromPlace.y > toPlace.y) return "ur";
  if (fromPlace.x > toPlace.x && fromPlace.y < toPlace.y) return "dl";
  return "ul";
}
function setUnit(unit, ground, unclickable = false, type) {
  if (!unit || !ground) return 0;
  if (type === "garage") {
    unit.posX = ground.posX;
    unit.posY = ground.posY;
    unit.ground = ground;
    ground.type = type;
    return 0;
  }
  if (type === "labaratory") {
    unit.posX = ground.posX;
    unit.posY = ground.posY;
    unit.ground = ground;
    ground.unit = unit;
    ground.unclickable = true;
    return 0;
  }
  if (type === "geyser") {
    unit.posX = ground.posX;
    unit.posY = ground.posY;
    unit.ground = ground;
    ground.type = type;
    return 0;
  }
  if (type === "stuff") {
    unit.posX = ground.posX;
    unit.posY = ground.posY;
    unit.ground = ground;
    return 0;
  }
  if (type === "unit") {
    unit.posX = ground.posX;
    unit.posY = ground.posY;
    unit.ground = ground;
    ground.unit = unit;
    ground.unclickable = unclickable;
    if (ground.type === "garage") unit.alpha = 0;
  }
}
async function shuffleUnit(unit) {
  let dir = {
    ur: { x: -10, y: 10 },
    r: { x: -10, y: 0 },
    dr: { x: -10, y: -10 },
    u: { x: 0, y: 10 },

    ul: { x: 10, y: 10 },
    l: { x: 10, y: 0 },
    dl: { x: 10, y: -10 },
    d: { x: 0, y: -10 },
  };
  await gsap.to(unit, {
    x: unit.x + dir[unit.unit.direction].x,
    y: unit.y + dir[unit.unit.direction].y,
    duration: 0.1,
    ease: "Power0.easeNone",
  });
  await gsap.to(unit, {
    x: unit.x - dir[unit.unit.direction].x,
    y: unit.y - dir[unit.unit.direction].y,
    duration: 0.1,
    ease: "Power0.easeNone",
  });
}
export {
  initMap,
  createJoystic,
  sortUnit,
  enableInteractiveMap,
  setUnit,
  moveCircle,
  moveUnit,
  updateText,
  getDirection,
  getMontain,
  getJoystics,
  isAvailableMove,
  isAvailableAttack,
  shuffleUnit,
};
