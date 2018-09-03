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
    if (this.client === null) {
      this.bpserver = new ButtplugServer(`Buttplug Relay room ${this.server.name}`);
    } else {
      this.bpserver = new ButtplugServer(`Buttplug Relay room ${this.server.name}`, 5000);
    }

    this.bpserver.addListener("message", (msg) => this.server.repeat(msg));

    this.bpserver.AddDeviceManager(this.server.devManager);
    for (const dev of this.server.devManager.devices) {
      this.server.devManager.emit("deviceadded", dev);
    }
  }

  public deviceAdded(aDevice: Device) {
      this.server.devManager.emit("relayDeviceAdded", this, aDevice);
  }

  public deviceRemoved(aDevice: Device) {
    this.server.devManager.emit("relayDeviceRemoved", this, aDevice);
  }
}

export {RelayClientType, RelayClient};
