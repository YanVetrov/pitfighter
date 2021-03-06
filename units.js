module.exports = {
  wizard: {
    id: 0,
    strength: 300,
    defence_melee: 1,
    defence_ranged: 15,
    damage: 35,
    fire_radius: 4,
    speed: 1,
    agility: 22,
    type: "wizard",
    weapon: "gun",
    range: "ranged",
    passive_skills: ["magic_shield"],
    active_skills: ["firewall"],
    active_skill_cooldown: 150,
    img: {
      name: "wizard",
      idle: [600, 600, 8, 8],
      attack: [600, 600, 8, 8],
      hurt: [600, 600, 4, 4],
      run: [450, 450, 8, 8],
      death: [600, 600, 5, 5],
    },
  },
  solo: {
    id: 0,
    strength: 250,
    defence_melee: 1,
    defence_ranged: 20,
    damage: 40,
    fire_radius: 4,
    speed: 1,
    agility: 25,
    type: "solo",
    weapon: "gun",
    range: "ranged",
    passive_skills: ["magic_armor"],
    active_skills: ["teleport"],
    active_skill_cooldown: 150,
    img: {
      name: "wizard2",
      idle: [1000, 1000, 8, 8],
      attack: [1000, 1000, 8, 8],
      hurt: [750, 750, 3, 3],
      run: [1000, 1000, 8, 8],
      death: [1000, 1000, 7, 7],
    },
  },
  samurai: {
    id: 0,
    strength: 400,
    defence_melee: 10,
    defence_ranged: 30,
    damage: 60,
    fire_radius: 1,
    speed: 2,
    agility: 20,
    type: "samurai",
    weapon: "sword",
    range: "melee",
    passive_skills: ["good_day_to_die"],
    active_skills: ["double_strike"],
    active_skill_cooldown: 150,
    img: {
      name: "samurai",
      idle: [800, 800, 4, 4],
      attack: [800, 800, 4, 4],
      hurt: [800, 800, 3, 3],
      run: [800, 800, 8, 8],
      death: [800, 800, 7, 7],
    },
  },
  bandit: {
    id: 0,
    strength: 350,
    defence_melee: 2,
    defence_ranged: 35,
    damage: 60,
    fire_radius: 1,
    speed: 2,
    agility: 25,
    type: "bandit",
    weapon: "sword",
    range: "melee",
    passive_skills: ["ricochette"],
    active_skills: ["steal"],
    active_skill_cooldown: 180,
    img: {
      name: "samurai2",
      idle: [800, 800, 8, 8],
      attack: [800, 800, 6, 6],
      hurt: [800, 800, 4, 4],
      run: [800, 800, 8, 8],
      death: [600, 600, 6, 6],
    },
  },
  bighead: {
    id: 0,
    strength: 450,
    defence_melee: 5,
    defence_ranged: 5,
    damage: 65,
    fire_radius: 1,
    speed: 1,
    agility: 15,
    type: "bighead",
    weapon: "sword",
    range: "melee",
    passive_skills: ["regeneration"],
    active_skills: ["stun"],
    active_skill_cooldown: 180,
    img: {
      name: "warrior",
      idle: [736, 548, 6, 6],
      attack: [736, 548, 4, 4],
      hurt: [736, 548, 3, 3],
      run: [736, 548, 8, 8],
      death: [552, 411, 9, 9],
    },
  },
  king: {
    id: 0,
    strength: 500,
    defence_melee: 30,
    defence_ranged: 0,
    damage: 50,
    fire_radius: 1,
    speed: 1,
    agility: 10,
    type: "king",
    weapon: "sword",
    range: "melee",
    passive_skills: ["mandate"],
    active_skills: ["heal_team"],
    active_skill_cooldown: 200,
    img: {
      name: "king",
      idle: [620, 620, 6, 6],
      attack: [620, 620, 6, 6],
      hurt: [620, 620, 4, 4],
      run: [620, 620, 8, 8],
      death: [620, 620, 11, 11],
    },
  },
};
