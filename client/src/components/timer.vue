<template>
  <span>{{ getTime || text }}</span>
</template>
<script>
export default {
  props: ["time", "text"],
  data() {
    return {
      tmp: "",
      intevral: "",
    };
  },
  computed: {
    getTime() {
      if (this.time > Date.now()) {
        this.tmp;
        let minutes = Math.floor((this.time - Date.now()) / 60000);
        let seconds = (((this.time - Date.now()) % 60000) / 1000).toFixed(0);
        let hours = Math.floor(minutes / 60);
        let days = Math.floor(hours / 24);
        hours = hours % 24;
        minutes = minutes % 60;
        if (minutes && minutes < 10) minutes = "0" + minutes;
        if (hours && hours < 10) hours = "0" + hours;
        this.tmp = seconds;
        this.$emit('timerUpdated',(this.time-Date.now())/1000);
        return (
          (days ? `${days}d ` : "") +
          (hours ? hours + ":" : "") +
          (minutes ? minutes + ":" : "") +
          (seconds < 10 ? "0" : "") +
          seconds
        );
      } else return null;
    },
  },
  created() {
    this.intevral = setInterval(() => {
      this.tmp = Date.now();
      if (Date.now() > this.time) clearInterval(this.interval);
    }, 1000);
  },
  watch: {
    time() {
      this.$emit('timeSetted',(this.time-Date.now())/1000);
      this.intevral = setInterval(() => {
        this.tmp = Date.now();
        if (Date.now() > this.time) clearInterval(this.interval);
      }, 1000);
    },
  },
  beforeDestroy() {
    clearInterval(this.intevral);
  },
};
</script>
