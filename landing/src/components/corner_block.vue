<template>
  <div style="position: relative">
    <slot />
    <img
      style="position: absolute; top: 5px; width: 150px; left: 5px"
      src="../assets/corner.webp"
    />
    <img
      style="
        position: absolute;
        width: 150px;
        right: 5px;
        left: auto;
        top: 0;
        transform: scale(-1, 1);
      "
      src="../assets/corner.webp"
    />
    <img
      style="
        position: absolute;
        width: 150px;
        top: auto;
        left: 0;
        bottom: 5px;
        transform: rotate(-90deg);
      "
      src="../assets/corner.webp"
    />
    <img
      style="
        position: absolute;
        top: auto;
        bottom: 5px;
        right: 5px;
        left: auto;
        transform: rotate(180deg);
        width: 150px;
      "
      src="../assets/corner.webp"
    />
  </div>
</template>
<style scoped>
img {
  pointer-events: none;
}
</style>
