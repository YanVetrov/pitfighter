
class User {
    constructor({ username, password, resources = require('./resources.js'), buildings = [], coins = 0, enemies = [], runes = 0, id = Date.now(), units = [] }) {
        this.username = username;
        this.login = username;
        this.password = password;
        this.resources = resources;
        this.buildings = buildings;
        this.coins = coins;
        this.runes = runes;
        this.id = id;
        this.units = units;
        this.enemies = enemies;
        this.npcs = [];
    }
}
module.exports = User;