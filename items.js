let obj = {
  fire_sword: {
    name: "Fire sword",
    available: "melee",
    type: "weapon",
    stats: {
      damage: 20,
      defence_melee: "-50",
    },
  },
  shotgun: {
    name: "Shotgun",
    available: "ranged",
    type: "weapon",
    stats: {
      damage: "100",
      fire_radius: -2,
    },
  },
  revolver: {
    name: "Revolver",
    available: "ranged",
    type: "weapon",
    stats: {
      damage: "40",
      fire_radius: -1,
      agility: "-10",
    },
  },
  magic_sword: {
    name: "Magic sword",
    available: "melee",
    type: "weapon",
    stats: {
      damage: "-20",
      agility: 15,
    },
  },
  bean_boots: {
    name: "Bean boots",
    available: "*",
    type: "clothes",
    part: "boots",
    stats: {
      agility: "-99",
      defence_melee: "-70",
      defence_ranged: "-70",
      strength: "-30",
    },
    effects: {
      stamina_discount: 0.5,
    },
  },
  power_armor: {
    name: "Power armor",
    available: "*",
    type: "clothes",
    part: "body",
    stats: {
      strength: 20,
      defence_melee: "15",
      defence_ranged: "15",
      agility: "-30",
    },
  },
  leather_armor: {
    name: "Leather armor",
    available: "*",
    type: "clothes",
    part: "body",
    stats: {
      strength: -30,
      defence_melee: "-5",
      defence_ranged: "-10",
      agility: 20,
    },
  },
  leather_boots: {
    name: "Leather boots",
    available: "*",
    type: "clothes",
    part: "boots",
    stats: {
      strength: -10,
      defence_melee: "-3",
      defence_ranged: "-5",
      agility: 10,
    },
  },
  power_boots: {
    name: "Power boots",
    available: "*",
    type: "clothes",
    part: "boots",
    stats: {
      strength: 10,
      defence_melee: "3",
      defence_ranged: "5",
      agility: "-20",
    },
  },
  chain_armor: {
    name: "Chain armor",
    available: "*",
    type: "clothes",
    part: "body",
    stats: {
      strength: 20,
      defence_melee: "10",
      defence_ranged: "-30",
      agility: "-20",
    },
  },
  magic_dagger: {
    name: "Magic dagger",
    available: "melee",
    type: "weapon",
    stats: {
      defence_melee: "-60",
      defence_ranged: "-60",
      damage: 30,
      agility: 25,
    },
  },
};
Object.keys(obj).forEach(key => (obj[key].key = key));
module.exports = obj;
