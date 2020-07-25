import {
  ButtplugClient,
  ButtplugMessage,
  ButtplugClientDevice,
  Log,
  ButtplugDeviceMessage,
  StopAllDevices,
  SingleMotorVibrateCmd,
  FromJSON,
  ErrorClass,
  Error as ButtplugError, Ok,
} from "buttplug";
import Vue from "vue";
import "vue-awesome/icons/bars";
import { Component, Model } from "vue-property-decorator";
const AppConfig = require("../../../dist/appconfig.json");
import { classToPlain } from "class-transformer";
import ComponentHelpText from "vue-buttplug-material-component/manual/manual.md";
import BpHelpText from "../manual/manual.md";
import TocHelpText from "../manual/toc.md";

@Component({})
export default class Relay extends Vue {
  private menuOpened: boolean = false;
  private client: ButtplugClient = new ButtplugClient("Haptics Relay");
  private devices: ButtplugClientDevice[] = [];
  private messages: string[] = [];
  private ws: WebSocket | null = null;
  private config: object = AppConfig;
  private isConnected: boolean = false;
  private errorMsg: string | null = null;
  private wsAddress: string = "";
  private helpText: string = TocHelpText + "\n" + ComponentHelpText + "\n" + BpHelpText;

  public data() {
    return {
      wsAddress: this.wsAddress,
    };
  }

  public mounted() {
    this.CreateNewClient();
    this.wsAddress = (location.protocol === "http:" ? "ws" : "wss") + "://" +
      location.host + "/" +
      this.$route.params.room;
    this.OpenWS();
  }

  private CreateNewClient() {
    this.client = new ButtplugClient("Haptics Relay");
    this.client.addListener("disconnect", this.OnClientDisconnect);
  }

  private ToggleDialog() {
    this.menuOpened = !this.menuOpened;
  }

  private OpenWS() {
    this.isConnected = false;
    this.errorMsg = null;
    this.ws = new WebSocket(this.wsAddress);
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

  private OnClientDisconnect() {
    this.devices = [];
    this.client.removeListener("disconnect", this.OnClientDisconnect);
    this.CreateNewClient();
    if (this.ws != null) {
      this.ws.send(JSON.stringify({type: "relay", message: { bpServerConnected: false }}));
    }
  }

  private OnClientConnect() {
    if (this.ws != null) {
      this.ws.send(JSON.stringify({type: "relay", message: { bpServerConnected: true }}));
    }
  }

  private OnSelectedDevicesChange(aDeviceList: ButtplugClientDevice[]) {
    // diff the arrays
    this.devices = aDeviceList;
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

  private OnDeviceDisconnected(aDevice: ButtplugClientDevice) {
    this.devices = this.devices.filter((device) => device.Index !== aDevice.Index);
    if (this.ws != null) {
      const dev = classToPlain(aDevice);
      this.ws.send(JSON.stringify({type: "relay", message: { deviceRemoved: dev }}));
    }
  }

  private OnDeviceConnected(aDevice: ButtplugClientDevice) {
    this.devices.push(aDevice);
    if (this.ws != null) {
      const dev = classToPlain(aDevice);
      this.ws.send(JSON.stringify({type: "relay", message: { deviceAdded: dev }}));
    }
  }

  private async OnDeviceMessage(aDevice: ButtplugClientDevice, aMessage: ButtplugDeviceMessage): Promise<ButtplugMessage> {
    await (Vue as any).Buttplug.SendDeviceMessage(aDevice, aMessage);
    return new Ok(aMessage.Id);
  }

}
