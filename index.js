const express = require("express"),
  app = express(),
  http = require("http").createServer(app),
  io = require("socket.io")(http, {
    cors: {
      origin: "*",
    },
  });

const host = "0.0.0.0";
const port = proccess.env.PORT;
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
  socket.on("move_unit", ({ id, x, y }) => {
    if (!id) return 0;
    let unit = socket.units.find(el => el.id === id);
    if (unit) {
      let diffX = Math.abs(unit.x - x);
      let diffY = Math.abs(unit.y - y);
      unit.y = y;
      unit.x = x;
      const room = socket.gameRoom;
      io.to(room).emit("unit_moved", { id, x, y });
    }
  });
  socket.on("attack", ({ id, target_id, target_owner }) => {
    if (!id || !target_id || !target_owner) return 0;
    console.log(id, target_id, target_owner);
    let unit = socket.units.find(el => el.id === id);
    let target_user = players.find(el => el.id === target_owner);
    if (!unit || !target_user) return console.log("no unit or user");
    let target = target_user.units.find(el => el.id === target_id);
    let diffX = Math.abs(unit.x - target.x);
    let diffY = Math.abs(unit.y - target.x);
    if (diffX > unit.fire_radius || diffY > unit.fire_radius) return 0;
    target.hp -= unit.damage;
    const room = socket.gameRoom;
    io.to(room).emit("attacked", { id, target_id, hp: target.hp });
  });
});
function startSession(player1, player2) {
  [player1, player2].forEach((socket, i) => {
    let first = i === 0;
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
        id: Date.now() + x + y + i,
        owner: socket.id,
        x,
        y,
        type,
        side: first ? "left" : "right",
      });
    }
    socket.status = "playing";
    let room = Date.now();
    socket.join(room);
    socket.gameRoom = room;
  });
  player1.emit("start_game", {
    self: player1.units,
    enemy: player2.units,
  });
  player2.emit("start_game", {
    self: player2.units,
    enemy: player1.units,
  });
}
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
async function getPlayersInRoom(room) {
  const sockets = await io.in(room).fetchSockets();
  return sockets;
}
async function destroySession(room) {
  let sockets = await getPlayersInRoom(room);
  sockets.forEach(el => {
    el.leave(room);
    el.status = "waiting";
  });
}
