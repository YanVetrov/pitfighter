const rarities = [{ name: 'common', count: 1 }, { name: 'uncommon', count: 3 }, { name: 'rare', count: 9 }, { name: 'epic', count: 27 }, { name: 'legendary', count: 81 }, { name: 'heroic', count: 243 }];
const builds = [
    {
        name: 'sawmill',
        resource: 'wood',
        defaultX: 4,
        defaultY: 2,
        maxRarityLvl: 3,
        building_type: 'miner',
        requirements: {
            wood: 15,
            stone: 15,
        },
    },
    {
        name: 'quarry',
        resource: 'stone',
        defaultX: 2,
        defaultY: 4,
        maxRarityLvl: 3,
        building_type: 'miner',
        requirements: {
            wood: 25,
            stone: 25,
        },
    },
    {
        name: 'mine',
        resource: 'steel',
        defaultX: 5,
        defaultY: 5,
        maxRarityLvl: 3,
        building_type: 'miner',
        requirements: {
            wood: 35,
            stone: 35,
        },
    },
    {
        name: 'armycamp',
        resource: 'steel',
        defaultX: 5,
        defaultY: 5,
        maxRarityLvl: 1,
        building_type: 'army',
        requirements: {
            wood: 35,
            stone: 35,
        },
    },
    // {
    //     name: 'barracks',
    //     resource: 'steel',
    //     defaultX: 5,
    //     defaultY: 5,
    //     maxRarityLvl: 3,
    //     requirements: {
    //         wood: 35,
    //         stone: 35,
    //     },
    // },
    // {
    //     name: 'shooting',
    //     resource: 'steel',
    //     defaultX: 5,
    //     defaultY: 5,
    //     maxRarityLvl: 1,
    //     requirements: {
    //         wood: 35,
    //         stone: 35,
    //     },
    // },
    // {
    //     name: 'hunter',
    //     resource: 'steel',
    //     defaultX: 5,
    //     defaultY: 5,
    //     maxRarityLvl: 1,
    //     requirements: {
    //         wood: 35,
    //         stone: 35,
    //     },
    // },
    // {
    //     name: 'camp',
    //     resource: 'leather',
    //     defaultX: 3,
    //     defaultY: 3,
    //     maxRarityLvl: 3,
    //     requirements: {
    //         wood: 45,
    //         stone: 45,
    //     },
    // },
].map(build => {
    return rarities.map((rar, i) => {
        let { requirements } = build;
        let rarityNum = i + 1
        if (rarityNum > build.maxRarityLvl) return null;
        requirements = { ...requirements }
        for (let k in requirements) {
            requirements[k] *= i + 1;
        }
        return { ...build, rarityNum, requirements, rarity: rar.name, countPerTick: rar.count, storage: rar.count * 24 }
    })
}).flat().filter(el => el).sort((a, b) => a.rarityNum - b.rarityNum).reduce((acc, el) => {
    acc[el.name + '_' + el.rarity] = el;
    return acc;
}, {})
module.exports = builds