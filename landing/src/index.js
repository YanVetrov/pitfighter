import Vue from "vue";
import App from "./App.vue";
import "./style.css";
import AOS from "aos";
import "aos/dist/aos.css";
Vue.config.productionTip = false;
new Vue({
  created() {
    AOS.init();
  },
  render: h => h(App),
}).$mount("#app");
