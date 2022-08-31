module.exports = {
    warrior: {
        id: 'c' + Date.now() + Math.ceil(Math.random() * 100),
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
}