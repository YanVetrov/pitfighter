<template>
  <div>
    <div class="circle" :style="{ opacity }">{{ message }}</div>
    <svg>
      <filter id="wavy">
        <feTurbulence
          x="0"
          y="0"
          baseFrequency="0.009"
          numOctaves="5"
          speed="2"
        >
          <animate
            attributeName="baseFrequency"
            dur="60s"
            values="0.02; 0.005; 0.02"
            repeatCount="indefinite"
          />
        </feTurbulence>
        <feDisplacementMap in="SourceGraphic" :scale="wavy" />
      </filter>
    </svg>
  </div>
</template>
<script>
import { gsap } from "gsap";
export default {
  props: ["message"],
  data() {
    return {
      wavy: 200,
      opacity: 0,
    };
  },
  async mounted() {
    gsap.to(this, { wavy: 8, duration: 0.4, delay: 1 });
    gsap.to(this, { opacity: 0.9, duration: 0.2, delay: 1 });
  },
};
</script>
<style scoped>
:root {
  --size: 110vh;
  --s: calc(var(--size) / 6);
  --bor: calc(var(--size) / 30);
  --boxShadow: calc(var(--size) / 12);
}
.circle {
  /* position: absolute; */
  pointer-events: none;
  z-index: 9999999;
  color: white;
  font-size: 35px;
  left: 50%;
  top: 30%;
  padding: 174px;
  text-align: center;
  display: flex;
  align-items: center;
  justify-content: center;
  /* transform: translate(-50%, -50%); */
  /* width: 60%;
  height: 60%; */
  filter: url(#wavy) blur(1px);
}

.circle:before,
.circle:after {
  content: "";
  position: absolute;
  top: var(--s);
  left: var(--s);
  right: var(--s);
  bottom: var(--s);
  border-radius: 50%;
  width: 70%;
  height: 70%;
  border: 15px solid #fff;
}
.circle:before {
  box-shadow: 0 0 var(--boxShadow) #0f0, inset 0 0 var(--boxShadow) #0f0;
  -webkit-box-reflect: below 10px
    linear-gradient(transparent, transparent, #0002);
  animation: move 5s linear infinite;
}

.circle:after {
  box-shadow: 0 0 calc(var(--bor) / 2) #000, inset 0 0 var(--bor) #000;
}

@keyframes move {
  0% {
    box-shadow: 0 0 var(--boxShadow) #0f0, inset 0 0 var(--boxShadow) #0f0;
    filter: hue-rotate(0deg);
  }
  20% {
    box-shadow: 0 0 60px #0f0, inset 0 0 60px #0f0;
  }

  40% {
    box-shadow: 0 0 40px #0f0, inset 0 0 40px #0f0;
  }
  60% {
    box-shadow: 0 0 80px #0f0, inset 0 0 80px #0f0;
  }
  80% {
    box-shadow: 0 0 100px #0f0, inset 0 0 100px #0f0;
  }
  100% {
    box-shadow: 0 0 var(--boxShadow) #0f0, inset 0 0 var(--boxShadow) #0f0;
    filter: hue-rotate(360deg);
  }
}

svg {
  width: 0;
  height: 0;
}
</style>
