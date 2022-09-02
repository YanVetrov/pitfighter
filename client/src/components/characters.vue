<template>
  <div class="row list">
    <div
      class="button building"
      v-for="item in Object.values(units)"
      :style="`background-image:url(${require('../assets/bg1.png')});`"
      :key="item.name"
      @click="$emit('buyUnit')"
    >
      <div class="buy_button">
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
      <img
        style="width: 180px"
        :src="require(`../assets/${item.name}/idle/dr/t1.png`)"
      /><span class="item_name">{{ item.name }}</span>
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
      <!-- <div class="profit">
        {{ item.name }}
      </div> -->
    </div>
  </div>
</template>
<script>
export default {
  props: ["units", "resources"],
};
</script>
