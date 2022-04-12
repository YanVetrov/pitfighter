<template>
  <div class="main_view">
    <div class="mobile_header">
      <div class="button">connect near</div>
      <img @click="active_header = !active_header" src="./assets/menu.svg" />
    </div>
    <cornerDiv
      class="title_block"
      style="background-image: url('./assets/bg.jpeg')"
    >
      <div class="header" :class="{ active_header }">
        <div class="header_point">main</div>
        <div
          class="header_point"
          @click="
            $refs.about.$el.scrollIntoView({ behavior: 'smooth' });
            active_header = false;
          "
        >
          about
        </div>
        <div
          class="header_point"
          @click="
            $refs.fighters.$el.scrollIntoView({ behavior: 'smooth' });
            active_header = false;
          "
        >
          fighters
        </div>
        <div
          class="header_point"
          @click="
            $refs.features.$el.scrollIntoView({ behavior: 'smooth' });
            active_header = false;
          "
        >
          features
        </div>
        <div
          class="header_point"
          @click="
            $refs.tokenomic.$el.scrollIntoView({ behavior: 'smooth' });
            active_header = false;
          "
        >
          tokenomics
        </div>
        <div
          class="header_point"
          @click="
            $refs.roadmap.$el.scrollIntoView({ behavior: 'smooth' });
            active_header = false;
          "
        >
          roadmap
        </div>
        <div class="header_point button">connect near</div>
      </div>
      <div
        class="main_title"
        data-aos="fade-up"
        data-aos-once="true"
        data-aos-duration="1000"
      >
        <div class="main_name">pitfighter</div>
        <div class="sub_name">SURVIVE AT ALL COSTS</div>
      </div>
      <div
        class="main_about"
        @click="$refs.about.$el.scrollIntoView({ behavior: 'smooth' })"
      >
        <div>about</div>
        <img class="about_animation" src="./assets/arrow_down.svg" />
      </div>
    </cornerDiv>
    <cornerDiv ref="about">
      <div class="wrapper gradient">
        <div class="main_intro padding">
          <div
            class="block_intro"
            data-aos="fade-up"
            data-aos-once="true"
            data-aos-offset="150"
            data-aos-delay="50"
            data-aos-duration="1000"
            data-aos-easing="ease-in-out"
          >
            <div class="row">
              <h1>introduction</h1>
              <img src="./assets/book.png" />
            </div>

            <div class="sub_intro">
              The Pit Fighter is a turn based strategy RPG
            </div>
            <div class="intro_descr">
              which has you leading a mercenary company in a gritty, low-power,
              medieval fantasy world. You decide where to go, whom to hire, what
              contracts to take and how to train and equip your men. Do you have
              what it takes to lead them through bloody arena battles and to
              victory? The game consists of a strategic world map and a tactical
              combat layer.
            </div>
          </div>
          <div
            class="block_demo"
            data-aos="fade-left"
            data-aos-offset="150"
            data-aos-delay="350"
            data-aos-duration="500"
            data-aos-easing="ease-in-out"
          >
            <div class="wrapper_demo">
              <img src="./assets/border.png" />
              <iframe
                height="315"
                style="
                  width: 486px;
                  top: 32px;
                  position: relative;
                  z-index: 1;
                  left: 17px;
                "
                src="https://www.youtube.com/embed/KQZUs5tDvVc"
                title="YouTube video player"
                frameborder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowfullscreen
              ></iframe>
            </div>
          </div>
        </div>
      </div>
    </cornerDiv>
    <cornerDiv ref="fighters">
      <div
        class="wrapper padding bg1"
        style="background-image: url('./assets/bg1.jpg')"
      >
        <div class="deck_wrapper">
          <deck />
        </div>
        <div class="time_line">
          <div class="row">
            <h1
              data-aos="fade-down"
              data-aos-offset="150"
              data-aos-delay="50"
              data-aos-duration="1000"
              data-aos-easing="ease-in-out"
            >
              Choose your fighter
            </h1>
            <img
              data-aos="fade-up"
              data-aos-once="true"
              data-aos-offset="150"
              data-aos-delay="500"
              data-aos-duration="1000"
              data-aos-easing="ease-in-out"
              src="./assets/sword.png"
            />
          </div>
          <h2
            data-aos="fade-left"
            data-aos-offset="150"
            data-aos-delay="50"
            data-aos-duration="1000"
            data-aos-easing="ease-in-out"
          >
            Fighters introduction
          </h2>
          <accordion
            data-aos="fade-left"
            data-aos-offset="150"
            data-aos-delay="50"
            data-aos-duration="1000"
            data-aos-easing="ease-in-out"
          >
            <accordion-item>
              <!-- This slot will handle the title/header of the accordion and is the part you click on -->
              <template slot="accordion-trigger">
                <h3>SURVIVE AT ALL COSTS</h3>
              </template>
              <!-- This slot will handle all the content that is passed to the accordion -->
              <template slot="accordion-content">
                <span
                  >Pit Fighter NFT Collectibles comes in 2 Fractions with three
                  race each.</span
                >
              </template>
            </accordion-item>
            <accordion-item>
              <!-- This slot will handle the title/header of the accordion and is the part you click on -->
              <template slot="accordion-trigger">
                <h3>CREATE ALLIES AND ENEMIES</h3>
              </template>
              <!-- This slot will handle all the content that is passed to the accordion -->
              <template slot="accordion-content">
                <span
                  >Each race will have their own town, arena, and more with
                  local benefits.</span
                >
              </template>
            </accordion-item>
            <accordion-item>
              <!-- This slot will handle the title/header of the accordion and is the part you click on -->
              <template slot="accordion-trigger">
                <h3>IMPRESS THE ARENA</h3>
              </template>
              <!-- This slot will handle all the content that is passed to the accordion -->
              <template slot="accordion-content">
                <span
                  >Each race will have their own town, arena, and more with
                  local benefits.</span
                >
              </template>
            </accordion-item>
          </accordion>
        </div>
      </div>
    </cornerDiv>
    <cornerDiv ref="features">
      <div class="wrapper padding">
        <div class="time_line">
          <div class="row">
            <h1
              data-aos="fade-down"
              data-aos-offset="150"
              data-aos-delay="50"
              data-aos-duration="1000"
              data-aos-easing="ease-in-out"
            >
              FEATURES
            </h1>
            <img
              data-aos="fade-up"
              data-aos-once="true"
              data-aos-offset="150"
              data-aos-delay="50"
              data-aos-duration="1000"
              data-aos-easing="ease-in-out"
              src="./assets/key.png"
            />
          </div>
          <h2
            data-aos="fade-right"
            data-aos-offset="150"
            data-aos-delay="50"
            data-aos-duration="1000"
            data-aos-easing="ease-in-out"
          >
            CORE GAME FEATURES
          </h2>
          <accordion
            data-aos="fade-right"
            data-aos-offset="150"
            data-aos-delay="50"
            data-aos-duration="1000"
            data-aos-easing="ease-in-out"
          >
            <accordion-item>
              <!-- This slot will handle the title/header of the accordion and is the part you click on -->
              <template slot="accordion-trigger">
                <h3>Arena PvP</h3>
              </template>
              <!-- This slot will handle all the content that is passed to the accordion -->
              <template slot="accordion-content">
                <span
                  >Choose between alliances with already three playable
                  characters for each side.</span
                >
              </template>
            </accordion-item>
            <accordion-item>
              <!-- This slot will handle the title/header of the accordion and is the part you click on -->
              <template slot="accordion-trigger">
                <h3>training hall</h3>
              </template>
              <!-- This slot will handle all the content that is passed to the accordion -->
              <template slot="accordion-content">
                <span
                  >Fighters can be upgraded for better performance and
                  value.</span
                >
              </template>
            </accordion-item>
            <accordion-item>
              <!-- This slot will handle the title/header of the accordion and is the part you click on -->
              <template slot="accordion-trigger">
                <h3>Grand Arena Tournament</h3>
              </template>
              <!-- This slot will handle all the content that is passed to the accordion -->
              <template slot="accordion-content">
                <span>Monthly tournament between cities.</span>
              </template>
            </accordion-item>
          </accordion>
        </div>
        <div
          class="slider_wrapper"
          data-aos="fade-left"
          data-aos-offset="150"
          data-aos-delay="50"
          data-aos-duration="1000"
          data-aos-easing="ease-in-out"
        >
          <carousel :autoplay="false" :autoplayTimeout="timeout" :perPage="1">
            <slide> <img src="./assets/game.png" /> </slide>
            <slide> <img src="./assets/game1.png" /> </slide>
            <slide> <img src="./assets/game2.png" /> </slide>
            <slide> <img src="./assets/game3.jpeg" /> </slide>
          </carousel>
        </div>
      </div>
    </cornerDiv>
    <cornerDiv
      ref="tokenomic"
      class="token_bg"
      style="background-image: url('./assets/token_bg.png')"
    >
      <div class="wrapper padding">
        <div class="token_main">
          <div
            data-aos="fade-down"
            data-aos-offset="150"
            data-aos-delay="50"
            data-aos-duration="500"
            data-aos-easing="ease-in-out"
          >
            <div class="row">
              <h1>TOKENOMICS</h1>
              <img src="./assets/cup.png" />
            </div>
            <h2>PLAY TO EARN</h2>
          </div>
          <div
            data-aos="fade-up"
            data-aos-once="true"
            data-aos-offset="150"
            data-aos-delay="50"
            data-aos-duration="500"
            data-aos-easing="ease-in-out"
          >
            Combine cards to gain levels Convert cards to crypto Trade with
            anyone Sell on multiple platforms
          </div>
        </div>
        <div class="token_blocks">
          <div
            class="token_block"
            data-aos="fade-left"
            data-aos-offset="150"
            data-aos-delay="50"
            data-aos-duration="500"
            data-aos-easing="ease-in-out"
          >
            <div class="token_title">GOLD</div>
            <div class="token_content">
              <div class="token_list">
                <div class="token_listitem">Utility token</div>
                <div class="token_listitem">
                  Earn this token through in game activities.
                </div>
                <div class="token_listitem">Maintenance of players NFTs</div>
                <div class="token_listitem">
                  Earned by heroes in arena, farming, staking.
                </div>
              </div>
              <div class="token_img">
                <img src="./assets/shield.png" />
              </div>
            </div>
          </div>
          <div
            class="token_block"
            data-aos="fade-left"
            data-aos-offset="150"
            data-aos-delay="250"
            data-aos-duration="500"
            data-aos-easing="ease-in-out"
          >
            <div class="token_title">SHARDS</div>
            <div class="token_content">
              <div class="token_list">
                <div class="token_listitem">Governance token.</div>
                <div class="token_listitem">
                  Available to buy on outside market.
                </div>
                <div class="token_listitem">Main Forging component</div>
                <div class="token_listitem">
                  Staking will give DAO for decentralized governance.
                </div>
              </div>
              <div class="token_img">
                <img src="./assets/shield.png" />
              </div>
            </div>
          </div>
          <div
            class="token_block"
            data-aos="fade-left"
            data-aos-offset="150"
            data-aos-delay="350"
            data-aos-duration="500"
            data-aos-easing="ease-in-out"
          >
            <div class="token_title">nft box</div>
            <div class="token_content" style="position: relative; top: 20px">
              <div class="token_list token_row">
                <div class="token_listitem">
                  <span class="green">lightbox</span>
                  <span>common</span>
                  <span>uncommon</span>
                  <span>rare</span>
                  <span class="token_percent">75%</span>
                </div>
                <div class="token_listitem">
                  <span class="blue">medium box</span>
                  <span>common</span>
                  <span>uncommon</span>
                  <span>rare</span>
                  <span class="token_percent">20%</span>
                </div>
                <div class="token_listitem">
                  <span class="purple">hard box</span>
                  <span>common</span>
                  <span>uncommon</span>
                  <span>rare</span>
                  <span class="token_percent">75%</span>
                </div>
              </div>
              <div class="token_img">
                <img src="./assets/shield.png" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </cornerDiv>
    <cornerDiv ref="roadmap">
      <div class="wrapper column">
        <img class="element" src="./assets/element.png" />
        <div class="row roadmap_title">
          <img src="./assets/paper.png" />
          <h1>Roadmap</h1>
          <img src="./assets/paper.png" />
        </div>
        <div class="row center roadmap_row">
          <div class="road" v-for="(k, i) in roadmap" :key="k">
            <img :src="require(`./assets/roadmap${i + 1}.png`)" />
            <div class="road_title">{{ k.title }}</div>
            <div class="road_descr">{{ k.content }}</div>
          </div>
        </div>
        <div class="row center roadmap_row_mobile">
          <carousel :autoplay="false" :autoplayTimeout="timeout" :perPage="1">
            <slide class="road" v-for="(k, i) in roadmap" :key="k">
              <img :src="require(`./assets/roadmap${i + 1}.png`)" />
              <div class="road_title">{{ k.title }}</div>
              <div class="road_descr">{{ k.content }}</div>
            </slide>
          </carousel>
        </div>
        <div class="row center input_row">
          <div class="input margin15">
            <span>Enter your email address</span>
            <input />
          </div>
          <div class="button">Subscribe</div>
        </div>
        <div class="footer row center">
          <div class="header_point">main</div>
          <div class="header_point">about</div>
          <div class="header_point">features</div>
          <div class="header_point">tokenomics</div>
          <img style="width: 10px" src="./assets/fb.svg" />
          <img src="./assets/twitter.svg" />
        </div>
      </div>
    </cornerDiv>
    <div class="sub_footer">
      <div class="copyright">2022 © pitfighter.io</div>
      <div class="privacy">
        Privacy Policy | Terms of Services | refund policy
      </div>
    </div>
  </div>
</template>

<script>
import cornerDiv from "./components/corner_block.vue";
import accordion from "./components/accordion.vue";
import accordionItem from "./components/accordion_item.vue";
import deck from "./components/deck.vue";
export default {
  components: { cornerDiv, accordion, accordionItem, deck },
  data() {
    return {
      active_header: false,
      timeout: 3000,
      roadmap: [
        { title: "NFT COLLECTION", content: "SOON" },
        { title: "EARLY ACCESS", content: "soon" },
        { title: "soon", content: "soon" },
        { title: "soon", content: "soon" },
        { title: "soon", content: "soon" },
        { title: "soon", content: "soon" },
      ],
    };
  },
  methods: {
    consol() {
      console.log(this.$refs.about);
    },
  },
  mounted() {
    setTimeout(() => this.timeout++, 3000);
  },
};
</script>
<style scoped></style>
