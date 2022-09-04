const express = require("express"),
  app = express();
const compression = require("compression");
const cors = require("cors");
const port = process.env.PORT || 8080;
const resources = require('./resources.js');
const builds = require('./buildings.js');
const passport = require("passport");
const LocalStrategy = require("passport-local").Strategy;
const session = require("express-session");
const bodyParser = require('body-parser')
const cookieParser = require('cookie-parser')
const multer = require('multer')
const upload = multer()
const User = require('./user.js')
const Building = require('./building.js')
const Unit = require('./unit.js')
const characters = require('./characters.js');
const { use } = require("passport");
const sleep = ms => new Promise(r => setTimeout(r, ms));
let players = {};
// let units = [1, 2, 3].map((el, i) => ({ ...characters.warrior, posY: 3 + i, posX: i + 4, id: 'u' + Date.now() + Math.ceil(Math.random() * 100) }))
// let enemies = [1, 2, 3].map((el, i) => ({ ...characters.warrior, damage: 7, posY: 8, posX: i + 4, enemy: true, id: 'u' + Date.now() + Math.ceil(Math.random() * 100) }))
players.admin = new User({ username: 'admin', password: 'admin', coins: 943, runes: 14, id: 1, units: [] })
app.use(
  cors({
    origin: "*",
  })
);
const sessionMiddleware = session({ secret: "changeit", resave: false, saveUninitialized: false });
app.use(sessionMiddleware);
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json())
app.use(cookieParser())
app.use(passport.initialize());
app.use(passport.session());
passport.use(
  new LocalStrategy(function verify(username, password, done) {
    console.log(username, password)
    if (!username || !password || (players[username] && players[username].password !== password)) {
      console.log("authentication wrong");
      return done(null, false, { error: true, message: 'No user found' });
    }
    else if (username && password && !players[username]) {
      console.log(`new user [${username}] created`)
      players[username] = new User({ username, password })
      return done(null, players[username]);
    }
    else {
      // let user = parsePlayer(players[username]);
      console.log("ok auth");
      return done(null, players[username]);
    }
  })
);
passport.serializeUser(function (user, cb) {
  process.nextTick(function () {
    cb(null, user);
  });
});

passport.deserializeUser(function (user, cb) {
  process.nextTick(function () {
    return cb(null, user);
  });
});
app.use(compression());
app.use("/", express.static("landing/dist"));
app.use("/game", express.static("client/dist"));
app.use(express.static(__dirname));
app.get("/clients-count", (req, res) => {
  console.log("ok");
  res.send({
    count: io.engine.clientsCount
  });
});
app.get("/", (req, res) =>
  res.sendFile(__dirname + "/landing/dist/index.html")
);
app.get("/game/", (req, res) =>
  res.sendFile(__dirname + "/client/dist/index.html")
);
app.post("/templates", (req, res) => {
  res.send({ builds, resources, characters });
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
app.post('/login', upload.none(), passport.authenticate('local', { failureRedirect: '/login', failureMessage: true }), (req, res) => {
  if (req.user) {
    res.send(req.user)
  }
  else res.send({ error: true, message: 'Incorrect' })
})
const server = app.listen(port, () => console.log("server started: ", port));












const io = require("socket.io")(server, {
  cors: {
    origin: "*",
  },
});
const wrap = middleware => (socket, next) => middleware(socket.request, {}, next);

io.use(wrap(sessionMiddleware));
io.use(wrap(passport.initialize()));
io.use(wrap(passport.session()));
io.use((socket, next) => {
  console.log(socket.request.isAuthenticated())
  if (socket.request.user) {
    console.log(socket.request.user)
    next();
  } else {
    next(new Error('unauthorized'))
  }
});
io.on("connection", function (socket) {
  socket.request.user = players[socket.request.user.username]
  let user = socket.request.user;
  console.log(`a user [${user.login}] connected`);
  user.buildings.forEach((build) => addBuildListeners(build, socket))
  user.units.forEach((ev) => addUnitListeners(ev, socket))
  user.enemies.forEach((ev) => addUnitListeners(ev, socket))
  socket.on('buy_building', async ({ name, rarity, x, y }) => {
    if (user.buildings.some(el => el.x === x && el.y === y)) return console.log('no place')
    let buildTemplate = builds[name + '_' + rarity];
    console.log(name, rarity)
    if (!buildTemplate) return console.log('no build');
    let build = new (Building())({ ...buildTemplate, owner: user.username, defaultX: x, defaultY: y });
    let reqs = build.requirements;
    let reses = user.resources;
    if (
      Object.keys(reqs).some(
        (key) => reqs[key] > reses[key]
      )
    )
      return console.log('no resources');
    for (let key in resources) {
      if (reses[key] >= reqs[key]) reses[key] -= reqs[key];
    }
    user.resources = reses;
    addBuildListeners(build, socket);
    user.buildings.push(build);
    socket.emit('new_build', build);
    socket.emit('update_resources', user.resources);
    build.activate();
  })
  socket.on('collect_build', ({ id }) => {
    let build = user.buildings.find(el => el.id === id);
    console.log(build)
    if (!build) return console.log('no build find to collect');
    build.collect();
  })
  socket.on('buy_unit', async ({ name }) => {
    let template = characters.warrior;
    if (!template) return console.log('no build');
    let unit = new Unit({ posY: Math.ceil(Math.random() * (5 - 3) + 3), posX: Math.ceil(Math.random() * (8 - 3) + 3) });
    let reqs = unit.requirements;
    let reses = user.resources;
    if (
      Object.keys(reqs).some(
        (key) => reqs[key] > reses[key]
      )
    )
      return console.log('no resources');
    for (let key in resources) {
      if (reses[key] >= reqs[key]) reses[key] -= reqs[key];
    }
    user.resources = reses;
    user.units.push(unit);
    socket.emit('new_unit', unit);
    socket.emit('update_resources', user.resources);
    if (user.units.length === 5) {
      let enemies = [1, 2, 3, 4, 5].map((el, i) => new Unit({ damage: 15, posY: Math.ceil(Math.random() * (9 - 7) + 7), posX: Math.ceil(Math.random() * (8 - 3) + 3), enemy: true }))
      user.enemies = enemies;
      setTimeout(() => {
        user.enemies.forEach((unit, i) => {
          addUnitListeners(unit, socket)
          setTimeout(() => {
            socket.emit('new_unit', unit);
            unit.enableAI({ units: user.units, buildings: user.buildings })
            setTimeout(() => { user.units[i].enableAI({ units: user.enemies }); addUnitListeners(user.units[i], socket) }, 1000)
          }, Math.random() * 8000)
        });
      }, 3000);
    }
  })
});
function addUnitListeners(unit, socket) {
  unit.onMove = (ev) => {
    return socket.emit('move_unit', ev);
  }
  unit.onAttack = (ev, target) => {
    socket.emit('unit_attacked', { unit: ev, target });
  }
}
function addBuildListeners(build, socket) {
  build.onTick = (ev) => {
    socket.emit('update_build', ev)
  }
  build.onCollect = (ev) => {
    let user = socket.request.user
    user.resources[ev.resource] += ev.store;
    socket.emit('update_resources', user.resources);
    socket.emit('update_build', ev)
    socket.emit('build_collected', ev);
  }
}