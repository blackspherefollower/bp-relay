import {Device, ButtplugServer} from "buttplug";
import RelayRoom from "./RelayRoom";
import RelayDevice from "./RelayDevice";
import * as WebSocket from "ws";

enum RelayClientType {
  UNKNOWN,
  BUTTPLUG_CLIENT,
  RELAY_CLIENT,
}

class RelayClient {
  public client: WebSocket | null;
  public id: number;
  public server: RelayRoom;
  public msgId: number = 0;

  public type: RelayClientType = RelayClientType.UNKNOWN;
  public devices: RelayDevice[] = [];
  public exDevices: RelayDevice[] = [];

  public bpserver: ButtplugServer | null = null;

  constructor(aClient: WebSocket | null, aId: number, aServer: RelayRoom) {
    this.client = aClient;
    this.id = aId;
    this.server = aServer;
  }

  public send(aData: any) {
    if (this.client !== null) {
      this.client.send(aData);
    }
  }

  public isButtplugClient() {
    this.bpserver = new ButtplugServer();
    this.bpserver.AddDeviceManager(this.server.devManager);
    this.bpserver.addListener("message", (msg) => this.server.repeat(msg));
  }

  public deviceAdded(aDevice: Device) {
    if (this.devices.findIndex((d) => d.ClientDevice.Index === aDevice.Index) === -1) {
      let dev = this.exDevices.find((d) => d.ClientDevice.Index === aDevice.Index);
      if (dev !== undefined) {
        this.exDevices.splice(this.devices.findIndex((d) => d.ClientDevice.Index === aDevice.Index), 1);
      }
      if (dev === undefined || dev.ClientDevice.Name !== aDevice.Name) {
        dev = new RelayDevice(this, aDevice);
      }
      this.devices.push(dev);
      this.server.devManager.emit("relayDeviceAdded", dev);
    }
  }

  public deviceRemoved(aDevice: Device) {
    const dev = this.devices.find((d) => d.ClientDevice.Index === aDevice.Index);
    if (dev !== undefined) {
      this.exDevices.push(dev);
      this.devices.splice(this.devices.findIndex((d) => d.ClientDevice.Index === aDevice.Index), 1);
      this.server.devManager.emit("relayDeviceRemoved", dev);
    }
  }
}

export {RelayClientType, RelayClient};
