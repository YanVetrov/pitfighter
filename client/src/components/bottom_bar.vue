<template>
  <div class="units_bottom">
    <div class="hider" @click="$emit('switch')">
      <img src="../assets/cards.svg" />
    </div>
    <div
      class="row skills"
      v-if="activeUnit"
      :style="{ backgroundImage: `url(${require('../assets/deck.jpeg')})` }"
    >
      <div v-for="skill in activeUnit.passive_skills" :key="skill">
        <img class="skill" :src="`../assets/skills/${skill}.png`" />
        <div>{{ skill }}</div>
        <div>[passive]</div>
      </div>
      <div
        v-for="skill in activeUnit.active_skills"
        :key="skill"
        @click="$emit('activate_skill', { id: activeUnit.id, skill_id: skill })"
      >
        <img
          class="skill"
          :style="{
            borderColor: activeUnit.selected_skill === skill ? 'green' : '',
            opacity: activeUnit.active_skill ? 1 : 0.6,
          }"
          :src="`../assets/skills/${skill}.png`"
        />
        <div>{{ skill }}</div>
        <div>[{{ activeUnit.active_skill ? 1 : 0 }}]</div>
      </div>
    </div>
    <div
      class="unit_main_info"
      style="background:url('../assets/steel.jpeg')"
      v-if="activeUnit"
    >
      <div class="img_info">
        <img
          :src="require(`../assets/characters/${activeUnit.img.name}/card.png`)"
        />
        <div class="stunned" v-if="activeUnit.stun > 0">STUNNED</div>
        <div class="main_hp bar">
          <div
            class="inner_bar"
            :style="{
              width: (activeUnit.hp / activeUnit.strength) * 100 + '%',
            }"
          ></div>
          <div class="inner_text">
            {{ activeUnit.hp }}/{{ activeUnit.strength }}
          </div>
        </div>
        <div class="main_stamina bar">
          <div
            class="inner_bar"
            :style="{ width: (activeUnit.stamina / totalCost) * 100 + '%' }"
          ></div>
          <div class="inner_text">{{ activeUnit.stamina }}/{{ totalCost }}</div>
        </div>
      </div>
      <div class="skills_info">
        <div class="unit_info_stat">
          <span>{{ activeUnit.strength }}</span>
          <img :src="`../assets/heart.svg`" />
        </div>
        <div class="unit_info_stat">
          <span>{{ activeUnit.damage }}</span>
          <img :src="`../assets/damage.svg`" />
        </div>
        <div class="unit_info_stat">
          <span>{{ activeUnit.speed }}</span>
          <img :src="`../assets/speed.svg`" />
        </div>
        <div class="unit_info_stat">
          <span>{{ activeUnit.fire_radius }}</span>
          <img :src="`../assets/radius.svg`" />
        </div>
        <div class="unit_info_stat">
          <span>{{ activeUnit.agility }}</span>
          <img :src="`../assets/agility.svg`" />
        </div>
        <div class="unit_info_stat">
          <span>{{ activeUnit.defence_melee }}</span>
          <img :src="`../assets/sword_shield.svg`" />
        </div>
        <div class="unit_info_stat">
          <span>{{ activeUnit.defence_ranged }}</span>
          <img :src="`../assets/arrow-shield.svg`" />
        </div>
        <div class="row">
          <img
            v-if="activeUnit.items.weapon"
            :src="require(`../assets/${activeUnit.items.weapon.key}.svg`)"
          />
          <img
            v-if="activeUnit.items.armor"
            :src="require(`../assets/${activeUnit.items.armor.key}.svg`)"
          />
          <img
            v-if="activeUnit.items.boots"
            :src="require(`../assets/${activeUnit.items.boots.key}.svg`)"
          />
        </div>
      </div>
    </div>
    <div
      class="units"
      :style="{ backgroundImage: `url(${require('../assets/deck.jpeg')})` }"
    >
      <div
        class="unit"
        v-for="(u, i) in selfUnits"
        @click="$emit('select', u)"
        :key="i"
        :style="u === activeUnit ? { border: '1px solid whitesmoke' } : {}"
      >
        <div class="unit_info">
          <img src="../assets/info.svg" />
          <div class="unit_info_blank">
            <div class="unit_info_stats">
              <div class="unit_info_stat">
                <span>{{ u.strength }}</span>
                <img :src="`../assets/heart.svg`" />
              </div>
              <div class="unit_info_stat">
                <span>{{ u.damage }}</span>
                <img :src="`../assets/damage.svg`" />
              </div>
              <div class="unit_info_stat">
                <span>{{ u.speed }}</span>
                <img :src="`../assets/speed.svg`" />
              </div>
              <div class="unit_info_stat">
                <span>{{ u.fire_radius }}</span>
                <img :src="`../assets/radius.svg`" />
              </div>
              <div class="unit_info_stat">
                <span>{{ u.agility }}</span>
                <img :src="`../assets/agility.svg`" />
              </div>
              <div class="unit_info_stat">
                <span>{{ u.defence_melee }}</span>
                <img :src="`../assets/sword_shield.svg`" />
              </div>
              <div class="unit_info_stat">
                <span>{{ u.defence_ranged }}</span>
                <img :src="`../assets/arrow-shield.svg`" />
              </div>
            </div>
          </div>
        </div>
        <div class="unit_img">
          <img :src="require(`../assets/characters/${u.img.name}/card.png`)" />
        </div>
        <div style="color:mediumseagreen;font-size:10px">
          <span :style="{ color: u.hp < 20 ? 'red' : 'mediumseagreen' }">{{
            u.hp
          }}</span
          >/{{ u.strength }}
        </div>
        <div class="unit_name">{{ u.type }}</div>
      </div>
    </div>
  </div>
</template>
<script>
export default {
  props: ["activeUnit", "selfUnits", "totalCost"],
};
</script>
<style scoped>
.skills {
  margin-top: 0;
  position: absolute;
  top: -120px;
  width: 229px;
  left: 30px;
  padding: 10px;
  border: 5px solid #bbb;
  border-radius: 15px;
}
.skills > div {
  color: white;
  font-size: 7px;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-shadow: 1px 1px 1px black;
}
.skill {
  border: 3px solid #aaa;
  width: 50px;
}
.stunned {
  position: absolute;
  top: 10px;
  color: red;
  padding: 5px;
  font-size: 20px;
  border: 3px solid red;
  background: black;
  transform: rotate(30deg);
}
</style>
