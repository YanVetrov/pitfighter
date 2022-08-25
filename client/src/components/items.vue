<template>
  <div class="row list">
    <!-- <div
        class="button"
        v-for="(item, name) in itemsPrice"
        v-if="!inventory.includes(name)"
        @click="emit('buyItem',name)"
        :key="name"
      >
        <img :src="require(`../assets/${name}.png`)" /><span class="item_name"
          >create {{ name }} </span
        ><br />
        <div class="row center" v-for="(val, key) in item" :key="key">
          <img :src="require(`../assets/${key}.png`)" style="width:20px" />[{{
            resources[key]
          }}/{{ val }}]
        </div>
      </div> -->
  </div>
</template>
<script>
export default {
  props: ["itemsPrice", "inventory", "resources"],
};
</script>
