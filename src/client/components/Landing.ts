import Vue from "vue";
import { Component, Model } from "vue-property-decorator";
import * as generate from "project-name-generator";

@Component({})
export default class Landing extends Vue {

  public room: string = "";

  public mounted() {
    this.room = generate({ words: 4 }).dashed;
  }

  public EnterRoom() {
    // Go to room
    this.$router.push({path: this.room});
  }
}
