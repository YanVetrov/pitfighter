import { Container, AnimatedSprite, Graphics, Text } from "pixi.js";
import { createAnimatedSprite } from "./utils.js";
import { store } from "./store.js";
import { gsap } from "gsap";
function getUnit({ type, weapon, ...el }, x, y, scaleX = 0.2, nick) {
  let textures = ["idle", "run", "attack", "death", "hurt"].reduce(
    (acc, key) => {
      acc[key] = createAnimatedSprite.apply(this, [
        `./assets/characters/${el.img.name}/${key}.png`,
        ...el.img[key],
      ]).textures;
      return acc;
    },
    {}
  );

  let soldier = new AnimatedSprite(textures.idle);
  let container = new Container();
  container.addChild(soldier);
  container.sortableChildren = true;
  container.unit = soldier;
  container.id = el.id;
  container.owner = el.owner;
  container.self = el.self;
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
  let ground = {};
  if (x && y) ground = store.map[y][x];
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
  let name = nick;
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
  healthBar.y = -60;
  container.addChild(healthBar);
  healthBar.zIndex = 3;
  let innerBar = new Graphics();
  innerBar.beginFill(0x333);
  innerBar.drawRoundedRect(0, 0, 100, 4, 30);
  innerBar.endFill();
  healthBar.addChild(innerBar);

  let outerBar = new Graphics();
  let percent = (el.hp / el.strength) * 100;
  outerBar.beginFill(0xff1151);
  outerBar.drawRoundedRect(0, 0, (el.hp / el.strength) * 100, 4, 30);
  outerBar.endFill();
  healthBar.addChild(outerBar);

  healthBar.outer = outerBar;
  container.hpText = new Text(`${el.hp}/${el.strength}`, {
    fill: 0xefefef,
    fontSize: 10,
    stroke: "#454545",
    strokeThickness: 2,
  });
  // healthBar.addChild(container.hpText);
  container.hpText.x = 30;
  container.hpText.y = -3;
  container.healthBar = outerBar;
  Object.defineProperty(container, "health", {
    get() {
      return this.unit.hp;
    },
    async set(val) {
      if (val < 0) val = 0;
      let color = 0xff1151;
      let percent = (val / el.strength) * 100;
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
  staminaBar.y = -40;
  container.addChild(staminaBar);
  staminaBar.zIndex = 3;
  let innerBar1 = new Graphics();
  innerBar1.beginFill(0x333);
  innerBar1.drawRoundedRect(0, 0, 100, 4, 30);
  innerBar1.endFill();
  staminaBar.addChild(innerBar1);

  let outerBar1 = new Graphics();
  outerBar1.beginFill(0xff9900);
  outerBar1.drawRoundedRect(0, 0, (el.stamina / 9) * 100, 4, 30);
  outerBar1.endFill();
  staminaBar.addChild(outerBar1);

  staminaBar.outer = outerBar1;
  container.staminaText = new Text(`${el.stamina}/${9}`, {
    fill: 0xefefef,
    fontSize: 10,
    stroke: "#454545",
    strokeThickness: 2,
  });
  // staminaBar.addChild(container.staminaText);
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
}
function removeUnits(owner) {
  store.gameScene.children
    .filter(el => el.owner === owner)
    .forEach(el => store.gameScene.removeChild(el));
}
export { getUnit, removeUnits };
