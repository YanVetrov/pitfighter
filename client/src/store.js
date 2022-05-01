let store = {
  id: null,

  gameScene: null,

  clicked: true,
  blockedUI: false,
  cellsInLine: 30,
  countLines: 30,
  map: [],
  allMapCount: 900,
  u: {},
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
};
Object.defineProperty(store, "unit", {
  get() {
    if (this.u && this.u.x) return this.u;
    else return false;
  },
  set(unit) {
    if (this.u) {
      this.u.active = false;
      let vueUnit = this.vue.selfUnits.find(el => el.id === this.u.id);
      if (vueUnit) vueUnit.active = false;
      if (this.u.ground) this.u.ground.tint = 0xffffff;
    }
    if (unit) {
      unit.active = true;
      let vueUnit = this.vue.selfUnits.find(el => el.id === unit.id);
      if (vueUnit) vueUnit.active = true;
      console.log(vueUnit);
      if (unit.ground) unit.ground.tint = 0x99ff99;
    }
    this.u = unit;
  },
});

export { store };
