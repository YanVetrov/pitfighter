const express = require("express"),
  app = express();
const compression = require("compression");
const cors = require("cors");
const units = require("./units.js");
const items = require("./items.js");
const port = process.env.PORT || 8080;
const sleep = ms => new Promise(r => setTimeout(r, ms));
let players = [];
const rooms = {};
let turnCount = 9;
let moveCost = 2;
let attackCost = 4;
const stunTime = 500;
const MAX_WAITING = 50000;
let unit_count = 6;
const server = app.listen(port, () => console.log("server started: ", port));
io = require("socket.io")(server, {
  cors: {
    origin: "*",
  },
});
app.use(
  cors({
    origin: "*",
  })
);
app.use(compression());
app.use("/", express.static("landing/dist"));
app.use("/game", express.static("client/dist"));
io.on("connection", function (socket) {
  console.log("a user connected");
  socket.status = "choose";
  players.push(socket);
  socket.on("choose", ({ units, nickname }) => {
    let anotherPlayer = players.find(el => el.status === "waiting");
    if (nickname) socket.nickname = nickname;
    addUnits(socket, units, !!anotherPlayer);
    socket.status = "waiting";
    if (anotherPlayer) startSession(socket, anotherPlayer);
  });
  socket.on("join", async ({ roomId }) => {
    if (rooms[roomId]) {
      roomId = Number(roomId);
      let enemy = rooms[roomId].players.map(el => el.units).flat();
      socket.client_type = "spectator";
      socket.gameRoom = roomId;
      socket.join(roomId);
      const sockets = await io.in(socket.gameRoom).fetchSockets();
      console.log(sockets.length);
      socket.emit("start_game", {
        enemy,
        self: [],
        roomId,
        spectator: true,
      });
      let { whoTurn, whoWait, availableTime } = rooms[roomId];
      socket.emit("turn_changed", {
        whoTurn,
        whoWait,
        availableTime,
      });
    }
  });
  socket.on("disconnect", function (e) {
    if (socket.client_type === "player") {
      const room = socket.gameRoom;
      io.to(room).emit("user_leaved", socket.id);
      destroySession(room);
    }
    players.splice(players.indexOf(socket), 1);
    console.log("A player disconnected");
    console.log("A number of players now ", players.length);
  });
  socket.on("move_unit", async ({ id, x, y }) => {
    if (!id || !socket.turn || socket.stun) return console.log("no id or turn");
    let unit = socket.units.find(el => el.id === id);
    let cost = moveCost;
    if (unit) {
      if (unit.stun > 0) return console.log("stunned");
      let teleport = unit.selected_skill === "teleport" && unit.active_skill;
      if (unit.effects && unit.effects["stamina_discount"])
        cost -= unit.effects["stamina_discount"];
      if (teleport) cost = 0;
      if (unit.stamina < cost) return console.log("no stamina");
      console.log({ newX: x, newY: y, oldX: unit.x, oldY: unit.y });
      let available = unit.speed;
      if (teleport) available = 10;
      if (
        !isAvailable({
          x1: unit.x,
          y1: unit.y,
          x2: x,
          y2: y,
          available,
        })
      )
        return console.log("no speed", { x, y, unitX: unit.x, unitY: unit.y });
      unit.y = y;
      unit.x = x;
      const room = socket.gameRoom;
      let enemy = await getEnemyInRoom(socket);
      io.to(room).emit("unit_moved", { id, x, y, teleport });
      if (teleport) {
        disableSkill(socket, id, unit);
      }
      let poison = rooms[room].poison;
      if (poison) {
        if (poison.x === x && poison.y === y) {
          unit.hp = unit.strength;
          io.to(room).emit("poison_hit", { id, hp: unit.hp });
        }
      }
      setTurn(socket, enemy, cost, unit);
    }
  });
  socket.on("attack", ({ id, target_id, target_owner }) =>
    attack(socket, { id, target_id, target_owner })
  );
  socket.on("turn_pass", async () => {
    if (socket.turn) {
      let room = socket.gameRoom;
      let enemy = await getEnemyInRoom(socket);
      swapTurn(socket, enemy);
    }
  });
  socket.on("activate_skill", ({ id, skill_id }) => {
    console.log("activate skill", { id, skill_id });
    if (!id || !socket.turn || socket.stun) return console.log("no id or turn");
    let unit = socket.units.find(el => el.id === id);
    if (!unit) return console.log("no unit");
    if (skill_id === "heal_team") heal_team(socket, id);
    else if (skill_id === "firewall") firewall_skill(socket, id);
    else
      changeUnit(socket, {
        id,
        key: "selected_skill",
        value: unit.selected_skill === skill_id ? "" : skill_id,
        unit,
      });
  });
});
async function firewall_skill(socket, id) {
  if (!id || !socket.turn || socket.stun) return console.log("no id or turn");
  let unit = socket.units.find(el => el.id === id);
  if (!unit || !unit.active_skills.includes("firewall") || !unit.active_skill)
    return console.log("no unit or user");
  // setStun(socket);
  let enemy = await getEnemyInRoom(socket);
  let availableUnits = enemy.units.filter(el =>
    isAvailable({
      x1: unit.x,
      y1: unit.y,
      x2: el.x,
      y2: el.y,
      available: 4,
    })
  );
  if (availableUnits.length === 0) return console.log("no available units");
  availableUnits.forEach((el, i) => {
    attack(socket, {
      id,
      target_id: el.id,
      target_owner: enemy.id,
      noCost: i !== 0,
    });
  });
  disableSkill(socket, id, unit);
}
function heal_team(socket, id) {
  if (!id || !socket.turn || socket.stun) return console.log("no id or turn");
  let unit = socket.units.find(el => el.id === id);
  if (!unit || !unit.active_skills.includes("heal_team") || !unit.active_skill)
    return console.log("no unit or user");
  setStun(socket);
  let availableUnits = socket.units
    .filter(el => el !== unit)
    .filter(el =>
      isAvailable({
        x1: unit.x,
        y1: unit.y,
        x2: el.x,
        y2: el.y,
        available: 4,
      })
    );
  if (availableUnits.length === 0) return console.log("no available units");
  availableUnits.forEach(el => {
    if (el.hp + 40 > el.strength) el.hp = el.strength;
    else el.hp += 40;
    io.to(socket.gameRoom).emit("poison_hit", { id: el.id, hp: el.hp });
  });
  disableSkill(socket, id, unit);
}
function changeUnit(socket, { id, key, value, unit }) {
  if (unit) unit[key] = value;
  socket.emit("unit_changed", { id, key, value });
}
function disableSkill(socket, id, unit) {
  if (!unit) unit = socket.units.find(el => el.id === id);
  if (!unit) return console.log("no unit");
  changeUnit(socket, { id, key: "active_skill", value: false, unit });
  changeUnit(socket, { id, key: "selected_skill", value: "", unit });
  setTimeout(() => {
    changeUnit(socket, { id, key: "active_skill", value: true, unit });
  }, unit.active_skill_cooldown * 1000);
  changeUnit(socket, {
    id,
    key: "skill_available_time",
    value: Date.now() + unit.active_skill_cooldown * 1000,
    unit,
  });
}
function startSession(player1, player2) {
  let room = Date.now();
  [player1, player2].forEach(socket => {
    socket.turnCount = turnCount;
    socket.status = "playing";
    socket.client_type = "player";
    socket.join(room);
    socket.gameRoom = room;
  });
  rooms[room] = {};
  rooms[room].id = room;
  rooms[room].players = [player1, player2];
  rooms[room].turns = 0;
  setTimeout(() => swapTurn(player1, player2), 2000);
  player1.emit("start_game", {
    self: player1.units,
    enemy: player2.units,
    roomId: room,
  });
  player2.emit("start_game", {
    self: player2.units,
    enemy: player1.units,
    roomId: room,
  });
}
function addUnits(socket, names, first) {
  let min = first ? 5 : 15;
  let max = first ? 14 : 25;
  socket.units = [];
  socket.side = first ? "left" : "right";
  names = names.slice(0, 6);
  for (let i = 0; i < names.length; i++) {
    let x = Math.floor(Math.random() * (max - min) + min);
    let y = Math.floor(Math.random() * (20 - 10) + 10);
    while (socket.units.find(el => el.x === x && el.y === y)) {
      x = Math.floor(Math.random() * (max - min) + min);
      y = Math.floor(Math.random() * (20 - 10) + 10);
    }
    let type = units[names[i].name].type;
    let weapon = items[names[i].weapon];
    let armor = items[names[i].armor];
    let boots = items[names[i].boots];
    let unit = calculateUnit(units[type], [weapon, armor, boots]);
    socket.units.push({
      ...unit,
      originUnit: units[type],
      id: Date.now() + "" + x + y + i,
      owner: socket.id,
      nickname: socket.nickname,
      hp: unit.strength,
      active_skill: true,
      items: { weapon, armor, boots },
      x,
      y,
      type,
      stun: 0,
      selected_skill: "",
      skill_available_time: 0,
      side: first ? "left" : "right",
      stamina: turnCount,
    });
  }
}
function attack(socket, { id, target_id, target_owner, noCost = false }) {
  if (!id || !target_id || !target_owner || !socket.turn || socket.stun)
    return console.log({
      id,
      target_id,
      target_owner,
      noCost,
      turn: socket.turn,
      stun: socket.stun,
    });
  let unit = socket.units.find(el => el.id === id);
  let target_user = players.find(el => el.id === target_owner);
  if (!unit || !target_user) return console.log("no unit or user");
  if (unit.stun > 0) return console.log("stunned");
  if (unit.stamina < attackCost && !noCost) return console.log("no stamina");
  // setStun(socket);
  setStun(target_user);
  let target = target_user.units.find(el => el.id === target_id);
  let options = {
    x1: unit.x,
    y1: unit.y,
    x2: target.x,
    y2: target.y,
    available: unit.fire_radius,
  };
  if (!isAvailable(options)) return console.log(options);
  let damage = unit.damage;
  let steal = unit.selected_skill === "steal" && unit.active_skill;
  let critical = false;
  if (!steal) {
    let chanceToHit = 100 - target.agility;
    if (chanceToHit <= 5) chanceToHit = 5;
    let miss = Math.round(Math.random() * 100) > chanceToHit;
    if (miss) damage = 0;
    if (Math.round(Math.random() * 100) < 25 && !miss) critical = true;
    if (critical) damage *= 1.5;
    if (unit.range === "melee")
      damage = damage - (damage * target.defence_melee) / 100;
    else damage = damage - (damage * target.defence_ranged) / 100;
    if (!miss && damage <= 0) damage = 1;
  }
  damage = Math.round(damage);
  target.hp -= damage;
  const room = socket.gameRoom;
  io.to(room).emit("attacked", { id, target_id, hp: target.hp, critical });
  if (steal) {
    if (unit.hp + damage > unit.strength) unit.hp = unit.strength;
    else unit.hp += damage;
    disableSkill(socket, id, unit);
    io.to(room).emit("poison_hit", { id, hp: unit.hp });
  }
  if (
    target.hp / target.strength < 0.3 &&
    !rooms[room].poison &&
    Math.random() > 0.6
  ) {
    console.log("posion set");
    let x = target.x + Math.floor(Math.random() * 2);
    let y = target.y + Math.floor(Math.random() * 2);
    rooms[room].poison = { x, y };
    io.to(room).emit("poison_set", { x, y });
  }
  setTurn(socket, target_user, noCost ? 0 : attackCost, unit);
  if (unit.selected_skill === "double_strike" && unit.active_skill) {
    disableSkill(socket, id, unit);
    setTimeout(() => {
      attack(socket, { id, target_id, target_owner, noCost: true });
    }, 500);
  }
  if (unit.selected_skill === "stun" && unit.active_skill) {
    disableSkill(socket, id, unit);
    target.stun = 2;
    changeUnit(target_user, {
      id: target_id,
      key: "stun",
      value: 2,
      unit: target,
    });
  }
}
function calculateUnit(unit, items) {
  let newUnit = { ...unit };
  items.forEach(item => {
    if (!item) return 0;
    Object.keys(item.stats).forEach(key => {
      let value = item.stats[key];
      let newVal;
      if (typeof value === "number") {
        newVal = newUnit[key] + value;
      } else {
        newVal = newUnit[key] + (newUnit[key] * parseFloat(value)) / 100;
      }
      newUnit[key] = Math.round(newVal);
    });
    if (item.effects) newUnit.effects = item.effects;
  });
  return newUnit;
}
async function getPlayersInRoom(room) {
  const sockets = await io.in(room).fetchSockets();
  return sockets;
}
async function getEnemyInRoom(socket) {
  const sockets = await io.in(socket.gameRoom).fetchSockets();
  return sockets.filter(
    el => el.id !== socket.id && el.client_type === "player"
  )[0];
}
function isAvailable({ x1, x2, y1, y2, available }) {
  let hex1 = y1 % 2;
  let hex2 = y2 % 2;
  let hexagonDiff = Math.abs(hex1 - hex2);
  let modificator = 0;
  if (hexagonDiff === 1) {
    if (hex1 && x2 < x1) modificator = -1;
    if (hex2 && x2 > x1) modificator = 1;
    x2 += modificator;
  }
  let diffX = Math.abs(x1 - x2);
  let diffY = Math.abs(y1 - y2);
  if (diffX > available || diffY > available) return false;
  else return true;
}
async function destroySession(room) {
  let sockets = await getPlayersInRoom(room);
  sockets.forEach(el => {
    el.leave(room);
    el.units = [];
    el.status = "choose";
    clearTimeout(el.timeout);
    el.stun = false;
    Object.values(rooms[room]).forEach(el => clearTimeout(el));
    rooms[room] = null;
    delete rooms[room];
  });
}
function setStun(socket) {
  socket.stun = true;
  setTimeout(() => (socket.stun = false), stunTime);
}
function setTurn(socket, enemy, cost, unit) {
  unit.stamina -= cost;
  rooms[socket.gameRoom].turns++;
  io.to(socket.gameRoom).emit("update_stamina", {
    id: unit.id,
    stamina: unit.stamina,
  });
}
async function swapTurn(player1, player2) {
  if (!player1 || !player2 || !player1.gameRoom || !player2.gameRoom)
    return console.log("no player or room");
  clearTimeout(player1.timeout);
  clearTimeout(player2.timeout);
  let availableTime = Date.now() + MAX_WAITING;
  if (!player1.turn && !player2.turn) player1.turn = true;
  player1.turn = !player1.turn;
  player2.turn = !player2.turn;
  let timeout = setTimeout(() => {
    swapTurn(player1, player2);
  }, MAX_WAITING);
  player1.timeout = timeout;
  player2.timeout = timeout;
  let whoTurn = player1.turn ? player1.id : player2.id;
  let whoWait = player1.turn ? player2.id : player1.id;
  rooms[player1.gameRoom].availableTime = availableTime;
  rooms[player1.gameRoom].whoTurn = whoTurn;
  rooms[player1.gameRoom].whoWait = whoWait;
  player1.units.forEach(el => (el.stamina = turnCount));
  player2.units.forEach(el => (el.stamina = turnCount));
  [player1, player2].forEach(socket =>
    socket.units
      .filter(el => el.stun > 0)
      .forEach(el => {
        el.stun--;
        changeUnit(socket, {
          id: el.id,
          key: "stun",
          value: el.stun,
          unit: el,
        });
      })
  );
  io.to(player1.gameRoom).emit("update_cost", {
    total: turnCount,
    available: turnCount,
  });
  io.to(player1.gameRoom).emit("turn_changed", {
    whoTurn,
    whoWait,
    availableTime,
  });
}
app.use(express.static(__dirname));
app.get("/clients-count", (req, res) => {
  console.log("ok");
  res.send({
    count: io.engine.clientsCount,
    rooms: Object.keys(rooms),
  });
});
app.get("/", (req, res) =>
  res.sendFile(__dirname + "/landing/dist/index.html")
);
app.get("/game/", (req, res) =>
  res.sendFile(__dirname + "/client/dist/index.html")
);
app.post("/units_templates", (req, res) => {
  res.send({ units, items });
});
app.post("/client/:id", (req, res) => {
  if (clients.indexOf(req.params.id) !== -1) {
    io.sockets.connected[req.params.id].emit(
      "private message",
      `Message to client with id ${req.params.id}`
    );
    return res.status(200).json({
      message: `Message was sent to client with id ${req.params.id}`,
    });
  } else return res.status(404).json({ message: "Client not found" });
});
