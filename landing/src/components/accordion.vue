<template>
  <ul class="accordion">
    <slot></slot>
  </ul>
</template>

<script>
export default {
  props: ["page"],
  data() {
    return {
      Accordion: {
        count: 0,
        active: 0,
      },
    };
  },
  provide() {
    return { Accordion: this.Accordion };
  },
  computed: {
    active() {
      return this.Accordion.active;
    },
  },
  watch: {
    active(val, old) {
      if (val !== old) {
        this.$emit("update", val);
        console.log("okokoko");
      }
    },
    page() {
      this.Accordion.active = this.page;
    },
  },
};
</script>

<style lang="scss" scoped>
.accordion {
  list-style: none;
  margin: 0;
  padding: 0;

  &__item:last-child {
    border-bottom: none;
  }
}
</style>
