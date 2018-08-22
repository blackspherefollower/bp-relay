import {Device} from "buttplug";
import RelayRoom from "./RelayRoom";
import RelayDevice from "./RelayDevice";
import * as WebSocket from "ws";

enum RelayClientType {
  UNKNOWN,
  BUTTPLUG_CLIENT,
  RELAY_CLIENT,
}

class RelayClient {
  public client: WebSocket;
  public id: number;
  public server: RelayRoom;
  public msgId: number = 0;

  public type: RelayClientType = RelayClientType.UNKNOWN;
  public devices: RelayDevice[] = [];
  public exDevices: RelayDevice[] = [];

  constructor(aClient: WebSocket, aId: number, aServer: RelayRoom) {
    this.client = aClient;
    this.id = aId;
    this.server = aServer;
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
