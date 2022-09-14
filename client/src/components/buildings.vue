<template>
  <div class="row list">
    <div class="filter_buttons row center" style="width: 100%">
      <div
        v-for="(val, key) in resources"
        class="profit filter_button"
        :class="{
          filter_button_active: filter === key,
          opacity05: tutorial_step === 2,
        }"
        @click="filter !== key ? (filter = key) : (filter = '')"
        :key="key"
        :style="`background-image:url(${require('../assets/bt2.png')});cursor:pointer;height:auto`"
      >
        <img :src="require(`../assets/${key}.png`)" />
      </div>
    </div>
    <div
      class="button building"
      :style="`background-image:url(${require('../assets/bg1.png')});`"
      v-for="(item, i) in objectsOnMap
        .filter(
          (el) =>
            !spawned.some(
              (sp) => el.name === sp.name && el.rarity === sp.rarity
            )
        )
        .filter((el) => (filter ? el.resource === filter : el))"
      :key="item.name + item.rarityNum"
      :class="stylish(item, i)"
      :id="
        i === 0 ? 'tutorial2' : item.building_type === 'army' ? 'tutorial4' : ''
      "
      @click="
        tutorial_step === 2 || tutorial_step === 4
          ? $emit('setTutorial', item)
          : $emit('spawnBuild', item)
      "
    >
      <div
        class="buy_button"
        :style="`background-image:url(${require('../assets/slot2.png')});`"
      >
        <div
          class="row center"
          v-for="(val, key) in item.requirements"
          :style="resources[key] >= val ? { color: 'forestgreen' } : ''"
          :key="key"
        >
          <img :src="require(`../assets/${key}.png`)" style="width: 20px" />[{{
            resources[key]
          }}/{{ val }}]
        </div>
      </div>
      <img :src="require(`../assets/${item.name}${item.rarityNum}.png`)" /><span
        class="item_name"
        >{{ item.name }}
        <span :class="item.rarity">{{ item.rarity }}</span></span
      >
      <br />
      <!-- <div
        class="row center"
        v-for="(val, key) in item.requirements"
        :key="key"
      >
        <img :src="require(`../assets/${key}.png`)" style="width: 20px" />[{{
          resources[key]
        }}/{{ val }}]
      </div> -->
      <div
        v-if="item.building_type !== 'army'"
        class="profit"
        :style="`background-image:url(${require('../assets/bt2.png')});`"
      >
        {{ item.countPerTick }}
        <img
          v-if="item.building_type !== 'army'"
          :src="require(`../assets/${item.resource}.png`)"
        />
        / hour
      </div>
      <div
        v-else
        class="profit"
        :style="`background-image:url(${require('../assets/bt2.png')});`"
      >
        {{ item.storage }}
        warriors
      </div>
    </div>
  </div>
</template>
<script>
export default {
  props: ["objectsOnMap", "spawned", "resources", "tutorial_step"],
  data() {
    return {
      filter: "",
    };
  },
  methods: {
    stylish(item, i) {
      let style = { opacity05: false, bubble: false };
      if (this.tutorial_step === 2) {
        if (i > 0) style.opacity05 = true;
        else style.bubble = true;
      } else if (this.tutorial_step === 4) {
        if (item.building_type === "army") style.bubble = true;
        else style.opacity05 = true;
      }
      return style;
    },
  },
};
</script>
