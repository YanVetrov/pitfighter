import { Sprite } from "pixi.js";
import { createAnimatedSprite } from "./utils.js";
import { store } from "./store.js";
import { getUnit, removeUnits } from "./unit.js";
import { gsap } from "gsap";
import { sound } from "@pixi/sound";
let vm = () => store.vue;
function start_game(data) {
  gsap.to(vm().$refs.audio, { volume: 0.15, duration: 0.5 });
  vm().socket.status = "playing";
  vm().roomId = data.roomId;
  data.self.forEach(el => {
    el.self = true;
    el.active = false;
  });
  vm().selfUnits = data.self;
  console.log(vm().selfUnits);
  [...data.self, ...data.enemy].forEach(el => {
    let hero = getUnit(
      el,
      el.x,
      el.y,
      el.x > 14 ? -0.2 : 0.2,
      el.nickname || vm().socket.id
    );
    store.gameScene.addChild(hero);
  });
}
function user_leaved(id) {
  console.log("leave");
  removeUnits(id);
  removeUnits(vm().socket.id);
  store.unit = null;
  vm().choose = true;
  vm().socket.status = "waiting";
  console.log("users removed");
}
async function unit_moved({ id, x, y, teleport }) {
  sound.play("move", { volume: 0.2 });
  let unit = store.gameScene.children.find(el => el.id === id);
  let target = store.gameScene.children.find(
    el => el.posX === x && el.posY === y
  );
  let selfUnit = vm().selfUnits.find(el => el.id === id);
  if (selfUnit) {
    selfUnit.x = x;
    selfUnit.y = y;
  }
  if (!teleport) unit.unit._textures = unit.unit.run;
  if (target.x > unit.x) unit.unit.scale.x = 1.5;
  else unit.unit.scale.x = -1.5;
  if (unit.unit.scale.x < 0) unit.unit.x = 360;
  else unit.unit.x = 1;

  unit.ground.tint = 0xffffff;
  unit.ground.unit = null;
  target.tint = 0x99ff99;
  unit.ground = target;
  target.unit = unit;
  if (!teleport) {
    await gsap.to(unit, {
      x: target.x + 20,
      y: target.y + 20,
      duration: 0.5,
    });
  } else {
    let tp = createAnimatedSprite(`./assets/teleport.png`, 100, 100, 56, 8)
      .sprite;
    unit.addChild(tp);
    tp.animationSpeed = 1;
    tp.scale.x = 6;
    tp.scale.y = 6;
    tp.zIndex = -1;
    tp.anchor.x = 0.2;
    tp.anchor.y = 0.1;
    tp.play();
    await gsap.to(unit, {
      alpha: 0,
      duration: 0.5,
    });
    unit.x = target.x + 20;
    unit.y = target.y + 20;
    await gsap.to(unit, {
      alpha: 1,
      duration: 0.5,
    });
    await gsap.to(tp, { alpha: 0, duration: 0.5 });
    unit.removeChild(tp);
  }
  unit.unit._textures = unit.unit.idle;
}
function update_stamina({ id, stamina }) {
  let unit = store.gameScene.children.find(el => el.id === id);
  let vueUnit = vm().selfUnits.find(el => el.id === id);
  unit.stamina = stamina;
  if (unit === store.unit) vm().availableCost = stamina;
  if (vueUnit) vueUnit.stamina = stamina;
}
async function attacked({ id, target_id, hp, critical }) {
  console.log("attacked", id, target_id, hp, critical);
  let unit = store.gameScene.children.find(el => el.id === id);
  let target = store.gameScene.children.find(el => el.id === target_id);
  if (target === store.unit) vm().health = hp;
  let selfUnit = vm().selfUnits.find(el => el.id === target_id);
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
  let hit = createAnimatedSprite(`./assets/hits/${random}.png`, 128, 128, 16, 4)
    .sprite;
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
    let blood = createAnimatedSprite("./assets/blood.png", 128, 128, 8, 4)
      .sprite;
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
}
function poison_set({ x, y }) {
  console.log("poison set", { x, y });
  let poison = Sprite.from("./assets/poison.png");
  poison.poison = true;
  let ground = store.map[y][x];
  poison.x = ground.x + 20;
  poison.y = ground.y + 20;
  poison.scale.x = 0.15;
  poison.scale.y = 0.15;
  store.gameScene.addChild(poison);
}

function poison_hit({ id, hp }) {
  console.log("poison hit");
  let unit = store.gameScene.children.find(el => el.id === id);
  store.gameScene.removeChild(store.gameScene.children.find(el => el.poison));
  let vueUnit = vm().selfUnits.find(el => el.id === id);
  unit.alphaCounter(`+${hp - unit.health}`, 0x33ff33);
  unit.health = hp;
  if (vueUnit) vueUnit.hp = hp;
}
function unit_changed({ id, key, value }) {
  console.log({ id, key, value });
  let vueUnit = vm().selfUnits.find(el => el.id === id);
  let unit = store.gameScene.children.find(el => el.id === id);
  if (unit) unit[key] = value;
  if (vueUnit) vueUnit[key] = value;
}
function turn_changed({ whoTurn, whoWait, availableTime }) {
  console.log("turned");
  sound.play("coin_flip");
  console.log(vm);
  vm().fireMessage = vm().socket.id === whoTurn ? "Your turn" : "Enemy turn";
  let turnedUnits = store.gameScene.children.filter(el => el.owner === whoTurn);
  let waitUnits = store.gameScene.children.filter(el => el.owner === whoWait);
  turnedUnits.forEach(el => (el.unit.alpha = 1));
  waitUnits.forEach(el => gsap.to(el.unit, { alpha: 0.7, duration: 0.5 }));
  [...turnedUnits, ...waitUnits].forEach(el => (el.stamina = vm().totalCost));
  vm().selfUnits.forEach(el => (el.stamina = vm().totalCost));
  vm().whoTurn = whoTurn;
  vm().whoWait = whoWait;
  vm().availableTime = availableTime;
}
export {
  turn_changed,
  poison_set,
  poison_hit,
  attacked,
  unit_moved,
  user_leaved,
  start_game,
  update_stamina,
  unit_changed,
};
