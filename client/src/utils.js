import * as PIXI from "pixi.js";
import {
  utils,
  SCALE_MODES,
  Rectangle,
  AnimatedSprite,
  Texture,
} from "pixi.js";
import { gsap } from "gsap";

import { PixiPlugin } from "gsap/PixiPlugin.js";
import { MotionPathPlugin } from "gsap/MotionPathPlugin.js";

function initGsap() {
  gsap.registerPlugin(PixiPlugin, MotionPathPlugin);
  window.__PIXI_INSPECTOR_GLOBAL_HOOK__ &&
    window.__PIXI_INSPECTOR_GLOBAL_HOOK__.register({ PIXI: PIXI });
}
function createAnimatedSprite(src, width, height, count, inLine) {
  console.log(src, width, height, count, inLine);
  let texture = utils.TextureCache[src];
  texture.baseTexture.scaleMode = SCALE_MODES.NEAREST;
  let textures = [];
  for (let i = 0; i < count; i++) {
    texture.frame = new Rectangle(
      (i % inLine) * width,
      Math.floor(i / inLine) * height,
      width,
      height
    );
    textures.push(new Texture(texture.baseTexture, texture.frame));
  }
  let sprite = new AnimatedSprite(textures);
  return { sprite, textures };
}
export { initGsap, createAnimatedSprite };
