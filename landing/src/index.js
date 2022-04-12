import Vue from "vue";
import App from "./App.vue";
import "./style.css";
import AOS from "aos";
import "aos/dist/aos.css";
import Vue2TouchEvents from "vue2-touch-events";

Vue.use(Vue2TouchEvents, {
  touchHoldTolerance: 400,
  swipeTolerance: 150,
  longTapTimeInterval: 400,
  namespace: "touch",
});
Vue.config.productionTip = false;
new Vue({
  created() {
    AOS.init();
  },
  render: h => h(App),
}).$mount("#app");
