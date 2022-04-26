import {
  Sprite,
  Texture,
  Container,
  Text,
  Graphics,
  AnimatedSprite,
} from "pixi.js";
import { gsap } from "gsap";
import { generateSpinner } from "./graphics.js";
import base from "./units_templates.js";
import { ColorOverlayFilter } from "@pixi/filter-color-overlay";
import unpack_units from "./parser";
import { BevelFilter } from "@pixi/filter-bevel";
import { transaction } from "./auth.js";
const objectsOnMap = [];
let friends = localStorage.getItem("friends");
if (!friends) {
  localStorage.setItem("friends", JSON.stringify({}));
  friends = {};
} else {
  friends = JSON.parse(friends);
}
let store = {
  state: null,
  admins: {
    metalwartest: true,
  },
  npc: {
    metalwarevil: true,
  },
  friends,
  stuffGetted: false,
  unitsGetted: false,
  id: null,
  mountains: null,
  logs: [],
  bg: null,
  gameScene: null,
  target: null,
  defaultFireTimeout: 30,
  defaultMoveTimeout: 30,
  defaultMineTimeout: 600,
  defaultStuffAction: 60,
  defualtCellCost: 900,
  clicked: true,
  blockedUI: false,
  cellsInLine: 30,
  countLines: 30,
  map: [],
  allMapCount: 900,
  miniMap: null,
  u: {},
  cash: [],
  text: {},
  visibleZone: [],
  defaultPosX: -400,
  defaultPosY: -650,
  x: 0,
  y: 0,
  user: {},
  units: [],
  unusedUnits: [],
  vue: {},
  objectsOnMap,
  getGaragesUnits({ x, y }) {
    return this.selfUnits.filter(el => el.posX === x && el.posY === y);
  },
};
Object.defineProperty(store, "unit", {
  get() {
    if (this.u && this.u.x) return this.u;
    else return false;
  },
  set(unit) {
    if (this.u) {
      this.u.active = false;
      this.u.interactive = false;
      this.u.buttonMode = false;
      let vueUnit = this.vue.selfUnits.find(el => el.id === this.u.id);
      if (vueUnit) vueUnit.active = false;
      if (this.u.ground) this.u.ground.tint = 0xffffff;
    }
    if (unit) {
      unit.active = true;
      let vueUnit = this.vue.selfUnits.find(el => el.id === unit.id);
      if (vueUnit) vueUnit.active = true;
      console.log(vueUnit);
      unit.buttonMode = true;
      unit.interactive = true;
      if (unit.ground) unit.ground.tint = 0x99ff99;
    }
    this.u = unit;
  },
});
Object.defineProperty(store, "unusedUnits", {
  get() {
    return this.units.filter(el => el.posX === 1 && el.posY === 1);
  },
});
Object.defineProperty(store, "selfUnits", {
  get() {
    return this.units.filter(el => el.self);
  },
});
Object.defineProperty(store, "garages", {
  get() {
    return this.objectsOnMap.filter(el => el.type === "garage");
  },
});
Object.defineProperty(store, "unitsInVisibleZone", {
  get() {
    // return this.units.filter(
    //   el =>
    //     this.visibleZone.some(
    //       ground => ground.posX === el.posX && ground.posY === el.posY
    //     ) &&
    //     (!this.garages.some(
    //       ground => ground.posX === el.posX && ground.posY === el.posY
    //     ) ||
    //       el.self)
    // );
    return this.units.filter(
      el =>
        el.posX >= store.x + 1 &&
        el.posX < store.x + 1 + store.cellsInLine &&
        el.posY >= store.y + 1 &&
        el.posY < store.y + 1 + store.countLines &&
        (!this.garages.some(
          ground => ground.posX === el.posX && ground.posY === el.posY
        ) ||
          el.self)
    );
  },
});
Object.defineProperty(store, "unitsFromKeys", {
  get() {
    return this.units.reduce((acc, el) => {
      acc[el.unit.asset_id] = el;
      return acc;
    }, {});
  },
});
function createObjectOnMap(el) {
  let container = new Container();
  let sprite = Sprite.from(`./assets/${el.image}.png`);
  sprite.zIndex = 1;
  sprite.interactive = false;
  sprite.buttonMode = false;
  Object.keys(el).forEach(key => (sprite[key] = el[key]));
  Object.keys(el).forEach(key => (container[key] = el[key]));
  let str = "";
  if (el.lvl) str = `${"LVL: " + el.lvl}`;
  if (el.owner) str = `${el.owner}`;
  if (el.type === "stuff") str = el.amount;
  let text = new Text(str, {
    fill: "#009534",
    fontFamily: "metalwar",
    fontSize: 20,
    stroke: "#000",
    strokeThickness: 4,
    align: "center",
  });
  text.anchor.set(-0.2, 0);
  text.scale.x = 1 + (1 - el.scaled);
  text.scale.y = 1 + (1 - el.scaled);
  if (el.asset_id) {
    text.scale.x = 4;
    text.scale.y = 4;
  }
  container.addChild(sprite);
  container.addChild(text);
  return container;
}
function createUnits(arr, handler) {
  return arr.map((el, i) => {
    let directions = ["u", "d", "r", "l", "ur", "ul", "dl", "dr"];
    let random = Math.ceil(Math.random() * (directions.length - 1));
    let sprite = Sprite.from(
      `./assets/cards/${el.image}/${directions[random]}.png`
    );
    directions.forEach(key => {
      sprite[key] = Texture.from(`./assets/cards/${el.image}/${key}.png`);
      if (el.type !== "validator" && !el.monster) {
        if (!sprite.broken) sprite.broken = {};
        if (!sprite.hp20) sprite.hp20 = {};
        if (!sprite.hp50) sprite.hp50 = {};
        sprite.broken[key] = Texture.from(
          `./assets/cards/${el.image}/broken/${key}.png`
        );
        sprite.hp20[key] = Texture.from(
          `./assets/cards/${el.image}/20hp/${key}.png`
        );
        sprite.hp50[key] = Texture.from(
          `./assets/cards/${el.image}/50hp/${key}.png`
        );
      }
      if (el.type === "validator") {
        sprite["stake_" + key] = Texture.from(
          `./assets/cards/${el.image}/stake_${key}.png`
        );
      }
      if (el.type === "miner") {
        sprite["mine_" + key] = Texture.from(
          `./assets/cards/${el.image}/mining/${key}.png`
        );
      }
    });

    let container = new Container();
    container.sortableChildren = true;
    generateSpinner(container);
    sprite.width = el.size || 120;
    sprite.height = el.size || 120;
    sprite.dir = "ul";
    container.posX = parseInt(el.location / 100000);
    container.posY = parseInt(el.location % 100000);
    container.diffX = el.diffX;
    container.diffY = el.diffY;
    container.type = "unit";
    Object.keys(el).forEach(key => (sprite[key] = el[key]));
    Object.defineProperty(sprite, "direction", {
      get() {
        return this.dir;
      },
      set(val) {
        if (!val) return "invalid";
        this.dir = val;
        let percent = (this.hp / this.strength) * 100;
        if (!this.monster) {
          if (percent <= 50) return (this.texture = this.hp50[val]);
          if (percent <= 30) return (this.texture = this.hp20[val]);
          if (percent > 50) this.texture = this[val];
        } else this.texture = this[val];
      },
    });
    container.name = el.name;
    container.locked = false;
    container.lt = 0;

    // container.timerText = new Text("", {
    //   fill: 0xefefef,
    //   fontFamily: "metalwar",
    //   fontSize: 15,
    // });

    // container.timerText.x = 70;
    // container.timerText.y = -20;
    let amount = el.stuff
      ? el.stuff.reduce((acc, el) => acc + el.amount * el.weight, 0)
      : 0;
    container.stuffCountText = new Text(`${amount}/${el.capacity}`, {
      fill: 0xefefef,
      fontFamily: "metalwar",
      fontSize: 10,
      stroke: "#454545",
      strokeThickness: 2,
    });
    container.stuffCountText.x = 30;
    container.stuffCountText.y = -3;
    container.getShards = () => ({
      type: el.shardCode,
      amount: el.shardCount,
      weight: 1,
    });
    container.hpText = new Text(`${el.hp}/${el.strength}`, {
      fill: 0xefefef,
      fontFamily: "metalwar",
      fontSize: 10,
      stroke: "#454545",
      strokeThickness: 2,
    });
    let color = el.self ? 0x00ffaa : 0xff3377;
    if (store.friends[el.owner]) color = 0x3377ff;
    if (store.npc[el.owner] || el.monster) color = 0xc3c507;
    container.owner = new Text(
      `${el.owner || "Enemy"}${store.npc[el.owner] ? "[NPC]" : ""}`,
      {
        fill: color,
        fontFamily: "metalwar",
        fontSize: 15,
        stroke: "#000",
        strokeThickness: 2,
      }
    );
    if (el.monster) container.owner.text = el.name;
    container.owner.zIndex = 4;
    if (store.admins[el.owner]) container.admin = true;
    container.alphaCounter = async function(
      text = "+1",
      color = 0xeeeeee,
      delay = 0
    ) {
      let options = {
        fill: color,
        fontFamily: "metalwar",
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
    container.miningAnimation = function() {
      setTimeout(
        () => (this.unit.texture = this.unit["mine_" + this.unit.direction]),
        100
      );
      setTimeout(
        () => (this.unit.texture = this.unit[this.unit.direction]),
        300
      );
      setTimeout(
        () => (this.unit.texture = this.unit["mine_" + this.unit.direction]),
        500
      );
      setTimeout(
        () => (this.unit.texture = this.unit[this.unit.direction]),
        700
      );
      setTimeout(
        () => (this.unit.texture = this.unit["mine_" + this.unit.direction]),
        900
      );
      setTimeout(
        () => (this.unit.texture = this.unit[this.unit.direction]),
        1100
      );
    };
    container.getMoveCooldown = function() {
      return (
        Date.now() + Math.floor(store.defualtCellCost / this.unit.speed) * 1000
      );
    };
    container.hpText.x = 30;
    container.hpText.y = -3;
    let healthBar = new Container();
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
    let capacityBar = new Container();
    capacityBar.x = 50;
    capacityBar.y = 30;
    if (!el.monster) container.addChild(capacityBar);
    capacityBar.zIndex = 3;
    let innerBar1 = new Graphics();
    innerBar1.beginFill(0x333);
    innerBar1.drawRoundedRect(0, 0, 100, 8, 30);
    innerBar1.endFill();
    capacityBar.addChild(innerBar1);

    let outerBar1 = new Graphics();
    outerBar1.beginFill(0xaba134);
    outerBar1.drawRoundedRect(
      0,
      0,
      el.stuff
        ? (el.stuff.reduce((acc, el) => acc + el.amount * el.weight, 0) /
            el.capacity) *
            100
        : 0,
      8,
      30
    );
    outerBar1.endFill();
    capacityBar.addChild(outerBar1);

    healthBar.outer = outerBar;
    container.owner.x = 50;
    container.self = el.self;
    container.unit = sprite;
    container.unit.x = -(el.size / 10);
    container.unit.y = 1;
    // container.unit.y = -(el.size/10)
    container.agr = { value: false, timeout: "" };
    container.spinner.scale.set(0.2);
    container.spinner.y = -20;
    container.spinner.x = 80;
    container.spinner.zIndex = 9;
    container.spinner.alpha = 0.5;
    // container.addChild(container.timerText);
    healthBar.addChild(container.hpText);
    container.addChild(container.owner);
    capacityBar.addChild(container.stuffCountText);
    container.addChild(sprite);
    container.healthBar = outerBar;
    container.capacityBar = outerBar1;
    if (el.self) container.on("pointerup", handler);
    // Object.defineProperty(container, "timer", {
    //   get() {
    //     return this.timerText.text;
    //   },
    //   set(val) {
    //     if (!val) val = "";
    //     this.timerText.text = val;
    //   },
    // });
    Object.defineProperty(container, "stuffCount", {
      get() {
        return this.unit.stuff
          ? this.unit.stuff.reduce((acc, el) => acc + el.amount * el.weight, 0)
          : 0;
      },
      set(val) {
        this.stuffCountText.text = `${val}/${this.unit.capacity}`;
        this.capacityBar.width = this.unit.stuff
          ? (this.unit.stuff.reduce(
              (acc, el) => acc + el.amount * el.weight,
              0
            ) /
              this.unit.capacity) *
              100 || 1
          : 1;
      },
    });
    Object.defineProperty(container, "lockedTime", {
      get() {
        return this.lt;
      },
      set(val) {
        this.lt = val;
        if (!val) {
          val = null;
          // this.timer = 0;
        }
        this.locked = !!val;
      },
    });
    container.lockedTime = el.lockedTime;
    let skunk = Sprite.from("./assets/skunk_fire/skunk_crash.png");
    skunk.scale.x = 0.6;
    skunk.scale.y = 0.6;
    skunk.x += 20;
    skunk.y += 10;
    Object.defineProperty(container, "poised", {
      get() {
        if (this.unit.poised_cnt > 0) return this.unit.poised_cnt;
        else return 0;
      },
      set(val) {
        if (val < 0 || isNaN(val)) val = 0;
        this.unit.poised_cnt = val;
        if (val === 0) {
          this.removeChild(skunk);
        } else {
          this.addChild(skunk);
        }
      },
    });
    if (container.poised) container.addChild(skunk);
    Object.defineProperty(container, "health", {
      get() {
        return this.unit.hp;
      },
      async set(val) {
        let color = 0x00ff00;
        let percent = (val / this.unit.strength) * 100;
        if (!this.unit.monster) {
          if (percent <= 50) {
            this.unit.texture = this.unit.hp50[this.unit.direction];
          }
          if (percent <= 30) {
            this.unit.texture = this.unit.hp20[this.unit.direction];
          }
          if (percent > 50) {
            this.unit.texture = this.unit[this.unit.direction];
          }
        }
        if (percent <= 30) {
          color = 0xff9999;
        }
        this.healthBar.width = (val / this.unit.strength) * 100 || 1;
        this.healthBar.tint = color;
        this.unit.hp = val;
        this.hpText.text = `${val}/${this.unit.strength}`;
        if (val === 0) {
          this.unit.texture = this.unit.broken[this.unit.direction];
        }
        await gsap.to(this.hpText.scale, { x: 1.1, y: 1.1, duration: 0.1 });
        await gsap.to(this.hpText.scale, { x: 1, y: 1, duration: 0.1 });
      },
    });
    Object.defineProperty(container, "agressive", {
      get() {
        return this.agr.value;
      },
      set(val) {
        this.agr.value = !!val;
        clearTimeout(this.agr.timeout);
        if (!!val) {
          this.unit.filters = [new ColorOverlayFilter(0xee4444, 0.35)];
          this.agr.timeout = setTimeout(() => (this.agressive = false), 10000);
        } else {
          this.unit.filters = [];
        }
      },
    });
    container.stakeValidator = function() {
      if (this.locked) return 0;
      if (!this.unit.type === "validator")
        return console.log("not validator =" + this.unit.type);
      this.unit.direction = "stake_" + this.unit.direction;
      window.sound("validator");
      this.locked = true;
    };
    if (el.type === "validator") {
      container.scale.x = 1.3;
      container.scale.y = 1.3;
    }
    container.health = el.hp;
    container.zIndex = el.x + el.y;
    return container;
  });
}

export { store };
