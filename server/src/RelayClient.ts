import {Device} from "buttplug";
import RelayRoom from './RelayRoom';
import RelayDevice from "./RelayDevice";
import * as WebSocket from 'ws';


enum RelayClientType {
  UNKNOWN,
  BUTTPLUG_CLIENT,
  RELAY_CLIENT
}

class RelayClient {
  client: WebSocket;
  id: number;
  server: RelayRoom;
  msgId: number = 0;

  type: RelayClientType = RelayClientType.UNKNOWN;
  devices: RelayDevice[] = [];
  exDevices: RelayDevice[] = [];

  constructor(aClient: WebSocket, aId: number, aServer: RelayRoom) {
    this.client = aClient;
    this.id = aId;
    this.server = aServer;
  }

  deviceAdded(aDevice: Device) {
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

  deviceRemoved(aDevice: Device) {
    const dev = this.devices.find((d) => d.ClientDevice.Index === aDevice.Index);
    if (dev !== undefined) {
      this.exDevices.push(dev);
      this.devices.splice(this.devices.findIndex((d) => d.ClientDevice.Index === aDevice.Index), 1);
      this.server.devManager.emit("relayDeviceRemoved", dev);
    }
  }
}

export {RelayClientType, RelayClient};