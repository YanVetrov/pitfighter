<template>
  <div class="wrapper" :style="{ color: color || 'coral' }">
    <div>{{ title }}</div>
    <!-- <div class="outer" :style="{ borderColor: color || 'chocolate' }">
      <div
        class="inner"
        :style="{
          width: (available / total) * 100 + '%',
          background: color || 'coral',
        }"
      ></div>
      <div class="inner_text">{{ available }}/{{ total }}</div>
    </div> -->

    <div class="c-progress-container">
      <svg
        class="c-progress-circle"
        xmlns="http://www.w3.org/2000/svg"
        viewBox="-1 -1 34 34"
      >
        <circle
          cx="16"
          cy="16"
          r="15.9155"
          class="c-progress-bar__background"
        />
        <circle
          cx="16"
          cy="16"
          r="15.9155"
          :stroke="color"
          class="c-progress-bar__progress js-progress-bar"
          :style="{ strokeDashoffset: 100 + (available / total) * 100 }"
        />
      </svg>
      <div class="c-progress-legend">
        <div class="c-legend__percent">{{ available }}</div>
        <div class="c-legend__text">/{{ total }}</div>
      </div>
    </div>
  </div>
</template>
<script>
export default {
  props: ["available", "total", "title", "color"],
};
</script>
<style scoped lang="scss">
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

$progress-bar-stroke-width: 2.25;
$progress-bar-progress-stroke-width: 2.27;
$progress-bar-size: 100px;

.c-progress-container {
  position: relative;
  width: $progress-bar-size;
  margin: 0 auto;
}

// SVG circle shape
.c-progress-circle {
  width: $progress-bar-size;
  height: $progress-bar-size;
  transform: rotate(-90deg);
}

// circle background
.c-progress-bar__background {
  fill: none;
  stroke: silver;
  stroke-width: $progress-bar-stroke-width;
  filter: blur(1px);
}

// circle progression
.c-progress-bar__progress {
  fill: none;
  stroke-dasharray: 100 100;
  stroke-dashoffset: 150;
  stroke-linecap: square;
  stroke-width: $progress-bar-progress-stroke-width;
  transition: stroke-dashoffset 0.75s ease-in-out;
}

// legend (placed within circle)
.c-progress-legend {
  position: absolute;
  width: 100%;
  top: 50%;
  left: 50%;
  padding: 20px;

  text-align: center;
  transform: translate(-50%, -50%);

  .c-legend__percent {
    font-size: 23px;
  }
  .c-legend__text {
    color: #333;
    opacity: 0.5;
  }
}
</style>
