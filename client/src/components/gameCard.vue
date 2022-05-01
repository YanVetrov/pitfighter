<template>
  <div class="character_block">
    <img :src="`../assets/characters/${img}/card.png`" />
    <div class="character_stats" style="margin:5px;">
      <div v-for="stat in stats" :key="stat">
        <img :src="`../assets/heart.svg`" /> {{ $props[stat] }}
        <span
          :style="{
            color: $props['calc_' + stat] > $props[stat] ? 'green' : 'darkred',
          }"
        >
          {{ $props["calc_" + stat] || "&zwnj;" }}</span
        >
      </div>
      <!-- <div>
        <img :src="`../assets/speed.svg`" /> {{ speed
        }}<span
          :style="{
            color: calc_speed > 0 ? 'green' : 'darkred',
          }"
        >
          {{ calculatePlus(unit, "speed") || " " }}</span
        >
      </div>
      <div>
        <img :src="`../assets/damage.svg`" /> {{ damage
        }}<span
          :style="{
            color: calculatePlus(unit, 'damage') > 0 ? 'green' : 'darkred',
          }"
        >
          {{ calculatePlus(unit, "damage") || " " }}</span
        >
      </div>
      <div>
        <img :src="`../assets/radius.svg`" /> {{ fire_radius
        }}<span
          :style="{
            color: calculatePlus(unit, 'fire_radius') > 0 ? 'green' : 'darkred',
          }"
        >
          {{ calculatePlus(unit, "fire_radius") || " " }}</span
        >
      </div>
      <div>
        <img :src="`../assets/agility.svg`" /> {{ agility }}%
        <span
          :style="{
            color: calculatePlus(unit, 'agility') > 0 ? 'green' : 'darkred',
          }"
        >
          {{ calculatePlus(unit, "agility") || " " }}</span
        >
      </div>
      <div>
        <img :src="`../assets/sword_shield.svg`" />
        {{ defence_melee }}%
        <span
          :style="{
            color:
              calculatePlus(unit, 'defence_melee') > 0 ? 'green' : 'darkred',
          }"
        >
          {{ calculatePlus(unit, "defence_melee") || "&zwnj;" }}</span
        >
      </div>
      <div>
        <img :src="`../assets/arrow-shield.svg`" />
        {{ defence_ranged }}%
        <span
          :style="{
            color:
              calculatePlus(unit, 'defence_ranged') > 0 ? 'green' : 'darkred',
          }"
        >
          {{ calculatePlus(unit, "defence_ranged") || "&zwnj;" }}</span
        >
      </div> -->
    </div>
    <div class="item">
      <div
        class="none"
        @click="$emit('weapon', '')"
        :style="{ borderColor: !activeWeapon ? 'mediumvioletred' : '' }"
      ></div>
      <img
        v-for="item in weapons"
        class="item_img"
        :style="{
          borderColor: activeWeapon === item ? 'mediumvioletred' : '',
        }"
        :src="require(`../assets/${item}.svg`)"
        @click="$emit('weapon', item)"
        :key="item"
      />
    </div>
    <div class="item">
      <div
        class="none"
        @click="$emit('armor', '')"
        :style="{ borderColor: !activeArmor ? 'darkorange' : '' }"
      ></div>
      <img
        v-for="item in armors"
        class="item_img"
        :style="{
          borderColor: activeArmor === item ? 'darkorange' : '',
        }"
        :src="require(`../assets/${item}.svg`)"
        @click="$emit('armor', item)"
        :key="item"
      />
    </div>
    <div class="item">
      <div
        class="none"
        @click="$emit('boots', '')"
        :style="{ borderColor: !activeBoots ? 'cornflowerblue' : '' }"
      ></div>
      <img
        v-for="item in boots"
        class="item_img"
        :style="{
          borderColor: activeBoots === item ? 'cornflowerblue' : '',
        }"
        :src="require(`../assets/${item}.svg`)"
        @click="$emit('boots', item)"
        :key="item"
      />
    </div>
    <div class="character_name">{{ name }}</div>
    <div class="row skills">
      <img
        class="skill"
        v-for="skill in skills"
        :key="skill"
        :src="`../assets/skills/${skill}.png`"
      />
    </div>
    <div style="display:flex;width:100%;justify-content:space-around;">
      <button
        style=" width: 100%;
  margin: 20px 0 0 0;border-radius:0"
        @click="$emit('choose')"
      >
        TAKE
      </button>
    </div>
  </div>
</template>

<script>
let stats = [
  "strength",
  "speed",
  "damage",
  "fire_radius",
  "agility",
  "defence_melee",
  "defence_ranged",
];
export default {
  props: [
    "name",
    "img",
    "activeWeapon",
    "activeArmor",
    "activeBoots",
    "weapons",
    "armors",
    "boots",
    "key",
    "skills",
    ...stats,
    ...stats.map(el => "calc_" + el),
  ],
  data() {
    return {
      stats,
    };
  },
};
</script>
