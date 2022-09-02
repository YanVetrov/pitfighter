<template>
    <div class="menu_wrapper"  @click.self="$emit('missclick')">
        <div class="menu" :style="`background-image:url(${require('../assets/bg.png')})`">
          <div class="menu_tabs">
            <div
              class="menu_tab"
              v-for="k in tabs"
              v-if="tabs"
              :class="{ tab_active: activeTab === k.component }"
              :key="k.title"
              @click="$emit('switchTab',k.component)"
            >
              {{ k.title }}
            </div>
            <div class="wallet_info row center">
              <div class="nickname">user429.near</div>
              <div class="coins row center">
                <img src="../assets/coin.png"></img>
                {{coins}}
              </div>
              <div class="coins row center">
                <img src="../assets/rune.png"></img>
                {{runes}}
              </div>
            </div>
          </div>
          <transition name="acc" mode="out-in">
            <slot></slot>
          </transition>
        </div>
      </div>
</template>
<script>
export default {
  props: ["tabs", "activeTab", "coins", "runes"],
};
</script>
