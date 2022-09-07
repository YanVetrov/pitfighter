
function Building() {
    let interval = ''
    return class Building {
        constructor({
            name,
            defaultX,
            defaultY,
            requirements,
            rarity,
            id = 'b' + Date.now(),
            countPerTick,
            rarityNum,
            resource,
            owner,
            building_type,
        }) {
            let args = arguments[0];
            Object.keys(args).forEach(key => this[key] = args[key])
            this.x = defaultX;
            this.y = defaultY;
            this.posX = defaultX;
            this.posY = defaultY;
            this.storage = countPerTick * 24
            this.tick = 60000;
            this.nextTickIn = 0;
            this.id = id;
            this.store = 0
            this.type = 'building'
            this.lastCollected = 0;
        }
        activate() {
            if (this.building_type === 'army') return console.log('army cant activate')
            if (!interval) {
                this.ticker();
                interval = setInterval(() => this.ticker(), this.tick)
                this.onActivate(this);
            }
        }
        deactivate() {
            this.nextTickIn = 0;
            clearInterval(interval)
            interval = null;
            this.onDeactivate(this)
        }
        ticker() {
            if (this.store + this.countPerTick <= this.storage) {
                this.nextTickIn = Date.now() + this.tick;
                this.store += this.countPerTick
                this.onTick(this)
            }
            else {
                this.deactivate()
            }
        }
        collect() {
            this.lastCollected = this.store;
            this.onCollect(this);
            this.store = 0;
            this.activate();
        }
        onCollect() { }
        onTick() { }
        onActivate() { }
        onDeactivate() { }

    }
}
module.exports = Building