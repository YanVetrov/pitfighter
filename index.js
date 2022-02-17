const express = require("express"),
  app = express(),
  http = require("http").createServer(app),
  io = require("socket.io")(http, {
    cors: {
      origin: "*",
    },
  });

const host = "0.0.0.0";
const port = 8080;
const sleep = ms => new Promise(r => setTimeout(r, ms));
let players = [];
let current_turn = 0;
let timeOut;
let _turn = 0;
const stunTime = 500;
const MAX_WAITING = 30000;
let units = {
  sold: {
    id: 0,
    hp: 300,
    strength: 300,
    damage: 20,
    fire_radius: 2,
    speed: 1,
    type: "sold",
    weapon: "gun",
  },
  hero: {
    id: 0,
    hp: 200,
    strength: 200,
    damage: 30,
    fire_radius: 3,
    speed: 2,
    type: "hero",
    weapon: "gun",
  },
};
let unit_count = 5;

io.on("connection", function (socket) {
  console.log("a user connected");
  socket.status = "waiting";
  let anotherPlayer = players.find(el => el.status === "waiting");
  players.push(socket);
  if (anotherPlayer) startSession(socket, anotherPlayer);
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
      let diffX = Math.abs(unit.x - x);
      let diffY = Math.abs(unit.y - y);
      unit.y = y;
      unit.x = x;
      if (diffX > unit.speed || diffY > unit.speed)
        return console.log("no speed");
      const room = socket.gameRoom;
      let enemy = await getEnemyInRoom(socket);
      io.to(room).emit("unit_moved", { id, x, y });
      swapTurn(socket, enemy);
    }
  });
  socket.on("attack", ({ id, target_id, target_owner }) => {
    if (!id || !target_id || !target_owner || !socket.turn || socket.stun)
      return console.log("no id or turn");
    let unit = socket.units.find(el => el.id === id);
    let target_user = players.find(el => el.id === target_owner);
    if (!unit || !target_user) return console.log("no unit or user");
    setStun(socket);
    setStun(target_user);
    let damage = unit.damage;
    let critical = Math.random() < 0.4;
    if (critical) damage *= 2;
    let target = target_user.units.find(el => el.id === target_id);
    let diffX = Math.abs(unit.x - target.x);
    let diffY = Math.abs(unit.y - target.y);
    if (diffX > unit.fire_radius || diffY > unit.fire_radius)
      return console.log(diffX, diffY);
    target.hp -= damage;
    const room = socket.gameRoom;
    io.to(room).emit("attacked", { id, target_id, hp: target.hp, critical });
    swapTurn(socket, target_user);
  });
});
function startSession(player1, player2) {
  [player1, player2].forEach((socket, i) => {
    let first = i === 0;
    let min = first ? 5 : 15;
    let max = first ? 14 : 25;
    socket.units = [];
    let type = first ? "hero" : "sold";
    socket.side = first ? "left" : "right";
    for (let i = 0; i < unit_count; i++) {
      let x = Math.floor(Math.random() * (max - min) + min);
      let y = Math.floor(Math.random() * (25 - 5) + 5);
      while (socket.units.find(el => el.x === x && el.y === y)) {
        x = Math.floor(Math.random() * (max - min) + min);
        y = Math.floor(Math.random() * (25 - 5) + 5);
      }
      socket.units.push({
        ...units[type],
        id: Date.now() + x + y + i,
        owner: socket.id,
        x,
        y,
        type,
        side: first ? "left" : "right",
      });
    }
    socket.status = "playing";
  });
  let room = Date.now();
  player1.join(room);
  player1.gameRoom = room;
  player2.join(room);
  player2.gameRoom = room;
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

async function getPlayersInRoom(room) {
  const sockets = await io.in(room).fetchSockets();
  return sockets;
}
async function getEnemyInRoom(socket) {
  const sockets = await io.in(socket.gameRoom).fetchSockets();
  return sockets.filter(el => el.id !== socket.id)[0];
}
async function destroySession(room) {
  let sockets = await getPlayersInRoom(room);
  sockets.forEach(el => {
    el.leave(room);
    el.units = [];
    el.status = "waiting";
    clearTimeout(el.timeout);
    el.stun = false;
  });
}
function setStun(socket) {
  socket.stun = true;
  setTimeout(() => (socket.stun = false), stunTime);
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

http.listen(port, host, () =>
  console.log(`Server listens http://${host}:${port}`)
);
