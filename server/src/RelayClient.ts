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

  type: RelayClientType = RelayClientType.UNKNOWN;
  devices: Device[] = [];

  constructor(aClient: WebSocket, aId: number, aServer: RelayRoom) {
    this.client = aClient;
    this.id = aId;
    this.server = aServer;
  }

  deviceAdded(aDevice: Device) {
    if (this.devices.findIndex((d) => d.Index === aDevice.Index) === -1) {
      this.devices.push(aDevice);
      let dev = new RelayDevice(aDevice.Index + (1000 * this.id), aDevice.Name, { "VibrateCmd" : {"FeatureCount" : 1}});
      this.server.devManager.emit("relayDeviceAdded", dev);
    }
  }

  deviceRemoved(aDevice: Device) {
    if (this.devices.findIndex((d) => d.Index === aDevice.Index) !== -1) {
      this.devices.splice(this.devices.findIndex((d) => d.Index === aDevice.Index), 1);
      let dev = new RelayDevice(aDevice.Index + (1000 * this.id), aDevice.Name, { "VibrateCmd" : {"FeatureCount" : 1}});
      this.server.devManager.emit("relayDeviceRemoved", dev);
    }
  }
}

export {RelayClientType, RelayClient};