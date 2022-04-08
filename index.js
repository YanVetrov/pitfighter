const express = require("express"),
  app = express();
const cors = require("cors");
const units = require("./units.js");
const port = process.env.PORT || 8080;
const sleep = ms => new Promise(r => setTimeout(r, ms));
let players = [];
const rooms = {};
let current_turn = 0;
let timeOut;
let _turn = 0;
let turnCount = 9;
let moveCost = 2;
let attackCost = 4;
const stunTime = 500;
const MAX_WAITING = 30000;
let unit_count = 6;
const server = app.listen(port, () => console.log("server started"));
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
io.on("connection", function (socket) {
  console.log("a user connected");
  socket.status = "choose";
  players.push(socket);
  socket.on("choose", units => {
    let anotherPlayer = players.find(el => el.status === "waiting");
    addUnits(socket, units, !!anotherPlayer);
    socket.status = "waiting";
    if (anotherPlayer) startSession(socket, anotherPlayer);
  });
  socket.on("disconnect", function (e) {
    const room = socket.gameRoom;
    players.splice(players.indexOf(socket), 1);
    io.to(room).emit("user_leaved", socket.id);
    destroySession(room);
    console.log("A player disconnected");
    console.log("A number of players now ", players.length);
  });
  socket.on("move_unit", async ({ id, x, y }) => {
    if (!id || !socket.turn || socket.stun) return console.log("no id or turn");
    let unit = socket.units.find(el => el.id === id);

    if (unit) {
      if (unit.stamina < moveCost) return console.log("no stamina");
      console.log({ newX: x, newY: y, oldX: unit.x, oldY: unit.y });
      if (
        !isAvailable({
          x1: unit.x,
          y1: unit.y,
          x2: x,
          y2: y,
          available: unit.speed,
        })
      )
        return console.log("no speed", { x, y, unitX: unit.x, unitY: unit.y });
      unit.y = y;
      unit.x = x;
      const room = socket.gameRoom;
      let enemy = await getEnemyInRoom(socket);
      io.to(room).emit("unit_moved", { id, x, y });
      let poison = rooms[room].poison;
      if (poison) {
        if (poison.x === x && poison.y === y) {
          unit.hp += 100;
          io.to(room).emit("poison_hit", { id, hp: unit.hp });
        }
      }
      setTurn(socket, enemy, moveCost, unit);
    }
  });
  socket.on("attack", ({ id, target_id, target_owner }) => {
    if (!id || !target_id || !target_owner || !socket.turn || socket.stun)
      return console.log("no id or turn");
    let unit = socket.units.find(el => el.id === id);
    if (unit.stamina < attackCost) return console.log("no stamina");
    let target_user = players.find(el => el.id === target_owner);
    if (!unit || !target_user) return console.log("no unit or user");
    setStun(socket);
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
    let chanceToHit = 100 - target.agility;
    if (chanceToHit <= 5) chanceToHit = 5;
    let miss = Math.round(Math.random() * 100) > chanceToHit;
    if (miss) damage = 0;
    let critical = false;
    if (Math.round(Math.random() * 100) < 25 && !miss) critical = true;
    if (critical) damage *= 1.5;

    target.hp -= damage;
    const room = socket.gameRoom;
    io.to(room).emit("attacked", { id, target_id, hp: target.hp, critical });
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
    setTurn(socket, target_user, attackCost, unit);
  });
  socket.on("turn_pass", async () => {
    if (socket.turn) {
      let room = socket.gameRoom;
      let enemy = await getEnemyInRoom(socket);
      swapTurn(socket, enemy);
    }
  });
});
function startSession(player1, player2) {
  let room = Date.now();
  [player1, player2].forEach(socket => {
    socket.turnCount = turnCount;
    socket.status = "playing";
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
  io.to(room).emit("update_cost", {
    total: turnCount,
    available: turnCount,
  });
}
function addUnits(socket, names, first) {
  let min = first ? 5 : 15;
  let max = first ? 14 : 25;
  socket.units = [];
  socket.side = first ? "left" : "right";
  for (let i = 0; i < names.length; i++) {
    let x = Math.floor(Math.random() * (max - min) + min);
    let y = Math.floor(Math.random() * (25 - 5) + 5);
    while (socket.units.find(el => el.x === x && el.y === y)) {
      x = Math.floor(Math.random() * (max - min) + min);
      y = Math.floor(Math.random() * (25 - 5) + 5);
    }
    let type = units[names[i]].type;
    socket.units.push({
      ...units[type],
      id: Date.now() + "" + x + y + i,
      owner: socket.id,
      x,
      y,
      type,
      side: first ? "left" : "right",
      stamina: turnCount,
    });
  }
}
async function getPlayersInRoom(room) {
  const sockets = await io.in(room).fetchSockets();
  return sockets;
}
async function getEnemyInRoom(socket) {
  const sockets = await io.in(socket.gameRoom).fetchSockets();
  return sockets.filter(el => el.id !== socket.id)[0];
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
  if (socket.units.every(el => el.stamina < moveCost)) swapTurn(socket, enemy);
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
  player1.units.forEach(el => (el.stamina = turnCount));
  player2.units.forEach(el => (el.stamina = turnCount));
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

app.get("/", (req, res) => res.sendFile(__dirname + "/client/dist/index.html"));
app.get("*", (req, res) => res.sendFile(__dirname + "/client/dist" + req.url));
app.get("/clients-count", (req, res) => {
  res.send({
    count: io.engine.clientsCount,
  });
});
app.post("/units_templates", (req, res) => {
  res.send(units);
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
