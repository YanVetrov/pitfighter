let defaultUnit = {
    strength: 100,
    defence_melee: 1,
    defence_ranged: 15,
    damage: 15,
    fire_radius: 1,
    speed: 1,
    agility: 5,
    type: "unit",
    range: "melee",
    hp: 100,
    posX: 0,
    posY: 0,
    name: 'warrior',
    requirements: {
        steel: 10,
        leather: 10,
    }
}
class Unit {
    constructor(args) {
        if (!args.id) this.id = 'u' + Date.now() + Math.ceil(Math.random() * 100);
        this.AI_STATUS = 'disabled'
        this.AI_TIMEOUT = 4000;
        this.escape = false;
        this.idleCount = 0;
        Object.keys(defaultUnit).forEach(key => this[key] = defaultUnit[key])
        Object.keys(args).forEach(key => this[key] = args[key])
    }
    isObjectFar({ x, y }) {
        if (Math.abs(this.posX - x) > 1 || Math.abs(this.posY - y) > 1) return true;
        else return false;
    }
    howObjectFar({ x, y }) {
        return { x: Math.abs(this.posX - x), y: Math.abs(this.posY - y) }
    }
    sortByDistance(arr) {
        return arr.filter(el => el).sort((a, b) => {
            let aDiff = this.howObjectFar({ x: a.posX, y: a.posY });
            let bDiff = this.howObjectFar({ x: b.posX, y: b.posY });
            if (aDiff === 0) aDiff = 1;
            if (bDiff === 0) bDiff = 1;
            aDiff = Math.abs(aDiff.x) + Math.abs(aDiff.y);
            bDiff = Math.abs(bDiff.x) + Math.abs(bDiff.y);
            return aDiff - bDiff;
        })
    }
    findNearestObject(arr) {
        return this.sortByDistance(arr)[0];
    }
    displaceUnitTo({ x, y }) {
        if (this.posX > x + 1) this.posX--
        if (this.posX < x - 1) this.posX++
        if (this.posY > y + 1) this.posY--
        if (this.posY < y - 1) this.posY++
        this.onMove(this)
    }
    moveUnitTo({ x, y }) {
        if (this.posX > x + 1) this.posX = x + 1;
        if (this.posX < x - 1) this.posX = x - 1;
        if (this.posY > y + 1) this.posY = y + 1;
        if (this.posY < y - 1) this.posY = y - 1;
        this.onMove(this)
    }
    enableAI(target) {
        this.AI_STATUS = 'enabled';
        this.AI(target)
    }
    disableAI() {
        this.AI_STATUS = 'disabled'
    }
    AI(target) {
        if (this.AI_STATUS === 'disabled') return console.log('ai disabled')
        if (this.hp <= 0) {
            this.disableAI();
            return this.onDead(this);
        }
        let units = target.units.filter(el => el.id !== this.id && el.hp !== 0);
        let buildings = target.buildings || [];
        buildings = buildings.filter(el => el.store > 0);
        let allObjects = [...units, ...buildings];
        if (units.length === 0) this.escape = false;
        if (this.escape) {
            this.displaceUnitTo({ x: this.posX, y: this.enemy ? 11 : 2 })
            return setTimeout(() => this.AI(target), this.AI_TIMEOUT * 1.5)
        }
        if (allObjects.length === 0) {
            if (this.enemy) return this.onEndCycle(this);
            this.idleCount++;
            if (this.idleCount > 25) { this.hp = 0; this.onDead(this); }
            return setTimeout(() => this.AI(target), this.AI_TIMEOUT * 3)
        }
        let nearest = this.findNearestObject(allObjects);
        if (!nearest) return console.log('no object near unit')
        if (this.isObjectFar({ x: nearest.posX, y: nearest.posY })) {
            console.log({ x: nearest.posX, y: nearest.posY });
            this.displaceUnitTo({ x: nearest.posX, y: nearest.posY })
            return setTimeout(() => this.AI(target), this.AI_TIMEOUT / 2)
        }
        if (nearest.type === 'building') this.attackBuilding(nearest)
        if (nearest.type === 'unit') this.attackUnit(nearest)
        setTimeout(() => this.AI(target), this.AI_TIMEOUT)
    }
    attackBuilding(build) {
        build.store--;
        if (build.store < 0) build.store = 0;
        this.onAttack(this, build)
    }
    attackUnit(target) {
        console.log('attacked', { hp: this.hp, target: target.hp })
        target.hp -= this.damage;
        if (target.hp < 30 && Math.random() > 0.6) target.escape = true;
        if (target.hp < 0) target.hp = 0;
        this.onAttack(this, target)
    }
    onAttack() { }
    onMove() { }
    onDead() { }
    onEndCycle() { }

}
module.exports = Unit;