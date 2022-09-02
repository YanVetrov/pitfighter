<template>
  <div class="row list">
    <div
      class="button building"
      :style="`background-image:url(${require('../assets/bg1.png')});`"
      v-for="item in objectsOnMap.filter(
        (el) =>
          !spawned.some((sp) => el.name === sp.name && el.rarity === sp.rarity)
      )"
      :key="item.name + item.rarityNum"
      @click="$emit('spawnBuild', item)"
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
        class="profit"
        :style="`background-image:url(${require('../assets/bt2.png')});`"
      >
        {{ item.countPerTick }}
        <img :src="require(`../assets/${item.resource}.png`)" /> / hour
      </div>
    </div>
  </div>
</template>
<script>
export default {
  props: ["objectsOnMap", "spawned", "resources"],
};
</script>
