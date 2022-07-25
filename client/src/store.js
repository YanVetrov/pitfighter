let store = {
  app: null,
  gameScene: null,
  blockedUI: false,
  cellsInLine: 8,
  countLines: 8,
  map: [],
  allMapCount: 64,
  left: "mountain-3",
  top: "forrest-3",
  right: "forrest-3",
  bottom: "lake-1",
  center: "grass-7",
  visibleZone: [],
  defaultPosX: 800,
  defaultPosY: 250,
  vue: {},
  itemsPrice: {
    pickaxe: {
      wood: 5,
      stone: 3,
    },
    axe: {
      wood: 8,
      stone: 5,
    },
    // spining: {
    //   wood: 5,
    //   stone: 5,
    // },
  },
  objectsOnMap: [
    {
      type: "building",
      name: "sawmill",
      level: 1,
      advice: "click to create woods",
      requirements: {
        wood: 35,
        stone: 35,
      },
      defaultX: 4,
      defaultY: 2,
    },
    {
      type: "building",
      name: "quarry",
      level: 1,
      requirements: {
        wood: 55,
        desk: 10,
      },
      defaultX: 2,
      defaultY: 4,
    },
    {
      type: "building",
      name: "camp",
      level: 1,
      requirements: {
        wood: 25,
        stone: 25,
      },
      defaultX: 5,
      defaultY: 5,
    },
    {
      type: "building",
      name: "workshop",
      level: 1,
      requirements: {
        steel: 25,
        desk: 10,
      },
      defaultX: 3,
      defaultY: 3,
    },
  ],
};

export { store };
