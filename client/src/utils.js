import * as PIXI from "pixi.js";
import { gsap } from "gsap";

import { PixiPlugin } from "gsap/PixiPlugin";
import { MotionPathPlugin } from "gsap/MotionPathPlugin";

function initGsap() {
  gsap.registerPlugin(PixiPlugin, MotionPathPlugin);
  window.__PIXI_INSPECTOR_GLOBAL_HOOK__ &&
    window.__PIXI_INSPECTOR_GLOBAL_HOOK__.register({ PIXI: PIXI });
}
export { initGsap };
