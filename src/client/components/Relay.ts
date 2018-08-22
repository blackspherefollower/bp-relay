import {
  ButtplugClient,
  ButtplugMessage,
  Device,
  Log,
  ButtplugDeviceMessage,
  StopAllDevices,
  SingleMotorVibrateCmd,
  FromJSON,
  ErrorClass,
  Error as ButtplugError,
} from "buttplug";
import Vue from "vue";
import "vue-awesome/icons/bars";
import { Component, Model } from "vue-property-decorator";
const AppConfig = require("../../../dist/appconfig.json");
import { classToPlain } from "class-transformer";

@Component({})
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
      (location.protocol === "http:" ? "ws" : "wss") + "://" +
      location.host + "/" +
      this.$route.params.room);
    this.ws.onopen = () => {
      this.isConnected = true;
      console.info("WebSocket open detected!");
      if (this.ws !== null) {
        this.ws.send(JSON.stringify({type: "relay", message: {relayClientConnected: "hello!"}}));
      }
    };
    this.ws.onmessage = (event) => this.OnNewMessage(event.data);
    this.ws.onclose = (event) => {
      console.error("WebSocket disconnect observed:", event);
      this.OpenWS();
    };
    this.ws.onerror = (event) => {
      console.error("WebSocket error observed:", event);
      this.errorMsg = event.toString();
      this.OpenWS();
    };
    if (this.ws.readyState === WebSocket.OPEN) {
      console.info("WebSocket open occurred?");
      this.isConnected = true;
      if (this.ws !== null) {
        this.ws.send(JSON.stringify({type: "relay", message: {relayClientConnected: "hello!"}}));
      }
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
    if (this.ws != null) {
      this.ws.send(JSON.stringify({type: "relay", message: { bpServerConnected: false }}));
    }
  }

  private OnClientConnect() {
    if (this.ws != null) {
      this.ws.send(JSON.stringify({type: "relay", message: { bpServerConnected: true }}));
    }
  }

  private OnDeviceConnected(aDevice: Device) {
    this.devices.push(aDevice);
    if (this.ws != null) {
      const dev = classToPlain(aDevice);
      this.ws.send(JSON.stringify({type: "relay", message: { deviceAdded: dev }}));
    }
  }

  private async OnNewMessage(aMessage: string) {
    // Process message
    const msgObj = JSON.parse(aMessage);
    if (msgObj.hasOwnProperty("type")) {
      switch (msgObj.type) {
        case "buttplug":
          try {
            const bmsg = FromJSON(msgObj.message);
            if (bmsg.length > 0 && (bmsg[0] instanceof ButtplugError)) {
              if ((bmsg[0] as ButtplugError).ErrorCode === ErrorClass.ERROR_MSG &&
                (bmsg[0] as ButtplugError).Id === 0) {
                throw new Error((bmsg[0] as ButtplugError).ErrorMessage);
              }
            }
            for (const m of bmsg) {
              console.log("message", "Valid BP message");
              if (m instanceof ButtplugDeviceMessage) {
                const dm = m as ButtplugDeviceMessage;
                const devs = this.devices.filter((device) => device.Index === dm.DeviceIndex);
                if (devs.length === 1) {
                  const outgoing = await this.OnDeviceMessage(devs[0], dm);
                  console.log(`renumbering response {outgoing.Id} to {dm.Id}`);
                  console.log("response", "[" + outgoing.toJSON() + "]");
                  if (this.ws != null) {
                    this.ws.send("[" + outgoing.toJSON() + "]");
                  }
                }
              }
            }
          } catch {
            // no-op
          }
          break;
        case "relay":
          break;
      }
    }

    // Message display
    this.messages.push(msgObj);
  }

  private OnDeviceDisconnected(aDevice: Device) {
    this.devices = this.devices.filter((device) => device.Index !== aDevice.Index);
    if (this.ws != null) {
      const dev = classToPlain(aDevice);
      this.ws.send(JSON.stringify({type: "relay", message: { deviceRemoved: dev }}));
    }
  }

  private async OnDeviceMessage(aDevice: Device, aMessage: ButtplugDeviceMessage): Promise<ButtplugMessage> {
    return (Vue as any).Buttplug.SendDeviceMessage(aDevice, aMessage);
  }

  private OnDragStart() {
    this.isDragging = true;
  }

  private OnDragStop() {
    this.isDragging = false;
  }
}
