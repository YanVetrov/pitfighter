let store = {
  app: null,
  gameScene: null,
  blockedUI: false,
  cellsInLine: 14,
  countLines: 14,
  map: [],
  allMapCount: 14 * 14,
  unplayableCount: 3,
  left: "mountain-3",
  top: "forrest-3",
  right: "forrest-3",
  bottom: "lake-1",
  center: "grass-7",
  visibleZone: [],
  defaultPosX: 800,
  defaultPosY: 250,
  groundWidth: 256,
  groundHeight: 143,
  vue: {},
  units: {},
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
  objectsOnMap: [],
  selfBuildings: {},
};

export { store };
