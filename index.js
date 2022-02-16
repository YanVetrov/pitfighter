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
let players = [];
let current_turn = 0;
let timeOut;
let _turn = 0;
const MAX_WAITING = 5000;
let units = {
  sold: {
    id: 0,
    hp: 250,
    strength: 250,
    damage: 20,
    fire_radius: 2,
    speed: 1,
    type: "sold",
    weapon: "gun",
  },
  hero: {
    id: 0,
    hp: 190,
    strength: 190,
    damage: 40,
    fire_radius: 4,
    speed: 1,
    type: "hero",
    weapon: "gun",
  },
};
let unit_count = 2;
function next_turn() {
  console.log("next turn");
  _turn = current_turn++ % players.length;
  players[_turn].emit("your_turn");
  console.log("next turn triggered ", _turn);
  triggerTimeout();
}

function triggerTimeout() {
  timeOut = setTimeout(() => {
    next_turn();
  }, MAX_WAITING);
}

function resetTimeOut() {
  if (typeof timeOut === "object") {
    console.log("timeout reset");
    clearTimeout(timeOut);
  }
}

io.on("connection", function (socket) {
  console.log("A player connected");
  let first = !players.length || players.some(el => el.side === "right");
  let min = first ? 5 : 11;
  let max = first ? 10 : 15;
  socket.units = [];
  let type = first ? "hero" : "sold";
  socket.side = first ? "left" : "right";
  for (let i = 0; i < unit_count; i++) {
    let x = Math.floor(Math.random() * (max - min) + min);
    let y = Math.floor(Math.random() * (15 - 5) + 5);
    socket.units.push({
      ...units[type],
      id: Date.now() + i,
      owner: socket.id,
      x,
      y,
      type,
      side: first ? "left" : "right",
    });
  }
  socket.emit("set_units", {
    self: socket.units,
    enemy: !first ? players[0].units : [],
  });
  socket.broadcast.emit("new_player", socket.units);
  players.push(socket);
  socket.on("disconnect", function () {
    players.splice(players.indexOf(socket), 1);
    socket.broadcast.emit("user_leaved", socket.id);
    console.log("A player disconnected");
    console.log("A number of players now ", players.length);
  });
  socket.on("move_unit", ({ id, x, y }) => {
    if (!id) return 0;
    let unit = socket.units.find(el => el.id === id);
    if (unit) {
      let diffX = Math.abs(unit.x - x);
      let diffY = Math.abs(unit.y - y);
      //   if (diffX > unit.speed || diffY > unit.speed) return 0;
      unit.y = y;
      unit.x = x;
      io.emit("unit_moved", { id, x, y });
    }
  });
  socket.on("attack", ({ id, target_id, target_owner }) => {
    if (!id || !target_id || !target_owner) return 0;
    console.log(id, target_id, target_owner);
    let unit = socket.units.find(el => el.id === id);
    let target_user = players.find(el => el.id === target_owner);
    if (!unit || !target_user) return 0;
    let target = target_user.units.find(el => el.id === target_id);
    let diffX = Math.abs(unit.x - target.x);
    let diffY = Math.abs(unit.y - target.x);
    if (diffX > unit.fire_radius || diffY > unit.fire_radius) return 0;
    target.hp -= unit.damage;
    io.emit("attacked", { id, target_id, hp: target.hp });
  });
});

app.use(express.static(__dirname));

app.get("/", (req, res) => res.render("index"));

//получение количества активных клиентов
app.get("/clients-count", (req, res) => {
  res.send({
    count: io.engine.clientsCount,
  });
});

//отправка сообщения конкретному клиенту по его id
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
