<template>
  <div class="wrapper" :style="{ color: color || 'coral' }">
    <div>{{ title }}</div>
    <div class="outer" :style="{ borderColor: color || 'chocolate' }">
      <div
        class="inner"
        :style="{
          width: (available / total) * 100 + '%',
          background: color || 'coral',
        }"
      ></div>
      <div class="inner_text">{{ available }}/{{ total }}</div>
    </div>
  </div>
</template>
<script>
export default {
  props: ["available", "total", "title", "color"],
};
</script>
<style scoped>
.wrapper {
  display: flex;
  flex-direction: column;
  align-items: center;
  position: fixed;
  bottom: 0;
  right: 0;
  background: transparent;
  color: coral;
  text-shadow: 2px 2px 3px #333;
  margin: 15px;
  height: auto;
  width: auto;
}
.outer {
  width: 200px;
  height: 20px;
  border: 2px solid #000;
  background: rgba(0, 0, 0, 0.5);
  border-radius: 5px;
  border-color: chocolate;
  position: relative;
}
.inner {
  width: 100%;
  height: 100%;
  background: coral;
}
.inner_text {
  position: absolute;
  top: 0;
  left: 48%;
  color: snow;
}
</style>
