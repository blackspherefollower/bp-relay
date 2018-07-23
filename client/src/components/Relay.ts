import { ButtplugClient, ButtplugMessage, Device, Log, ButtplugDeviceMessage, StopAllDevices,
         SingleMotorVibrateCmd } from "buttplug";
import Vue from "vue";
import "vue-awesome/icons/bars";
import { Component, Model } from "vue-property-decorator";
const AppConfig = require("../../dist/appconfig.json");

@Component({
})
export default class Relay extends Vue {
  private hasOpenedMenu: boolean = false;
  private menuOpened: boolean = false;
  private devices: Device[] = [];
  private messages: string[] = [];
  private isDragging: boolean = false;
  private ws: WebSocket | null = null;
  private config: object = AppConfig;
  private isConnected: boolean = false;
  private errorMsg: string | null = null;

  public mounted() {
    this.OpenWS();
  }

  private OpenWS() {
    this.isConnected = false;
    this.errorMsg = null;
    this.ws = new WebSocket(
      //(location.protocol === "http" ? "ws" : "wss") + "://" +
      //location.host + ":" +
      //location.port + "/room/" +
      "ws://localhost:3000/" +
      this.$route.params['room']);
    this.ws.onopen = () => {
      this.isConnected = true;
      console.info("WebSocket open detected!");
      this.ws != null && this.ws.send(JSON.stringify({relayClientConnected: 'hello!'}));
    }
    this.ws.onmessage = (event) => this.OnNewMessage(event.data);
    this.ws.onclose = () => this.mounted();
    this.ws.onerror = (event) => {
      console.error("WebSocket error observed:", event);
      this.errorMsg = event.toString();
      this.OpenWS();
    };
    if (this.ws.readyState == WebSocket.OPEN) {
      console.info("WebSocket open occured?");
      this.isConnected = true;
      this.ws != null && this.ws.send(JSON.stringify({relayClientConnected: 'hello!'}));
    }
  }

  private SideNavOpen() {
    if (this.isDragging) {
      return;
    }
    if (!this.hasOpenedMenu) {
      this.hasOpenedMenu = true;
    }
    this.menuOpened = true;
  }

  private SideNavClose() {
    if (this.isDragging) {
      return;
    }
    this.menuOpened = false;
  }

  private ToggleLeftSideNav() {
    if (!this.hasOpenedMenu) {
      this.hasOpenedMenu = true;
    }
    this.menuOpened = !this.menuOpened;
  }

  private OnClientDisconnect() {
    this.devices = [];
    if(this.ws != null) {
      this.ws.send(JSON.stringify(this.devices));
    }
  }

  private OnDeviceConnected(aDevice: Device) {
    this.devices.push(aDevice);
    if(this.ws != null) {
      this.ws.send(JSON.stringify({ deviceAdded: aDevice }));
    }
  }

  private OnNewMessage(aMessage: string) {
    this.messages.push(aMessage);
  }

  private OnDeviceDisconnected(aDevice: Device) {
    this.devices = this.devices.filter((device) => device.Index !== aDevice.Index);
    if(this.ws != null) {
      this.ws.send(JSON.stringify({ deviceRemoved: aDevice }));
    }
  }

  private async OnDeviceMessage(aDevice: Device, aMessage: ButtplugDeviceMessage) {
    (Vue as any).Buttplug.SendDeviceMessage(aDevice, aMessage);
  }

  private OnDragStart() {
    this.isDragging = true;
  }

  private OnDragStop() {
    this.isDragging = false;
  }
}
