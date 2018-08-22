import {ButtplugMessage, ButtplugServer} from "buttplug";
import {RelayClient, RelayClientType} from "./RelayClient";
import RelayDeviceManager from "./RelayDeviceManager";
import * as WebSocket from "ws";

class RelayRoom {
  public clientCount: number = 0;
  public clients: RelayClient[] = [];
  public server: ButtplugServer;
  public devManager: RelayDeviceManager;

  constructor() {
    this.devManager = new RelayDeviceManager(this);
    this.server = new ButtplugServer();
    this.server.AddDeviceManager(this.devManager);
    this.server.addListener("message", (msg) => this.repeat(msg));
  }

  public addClient(aClient: WebSocket): RelayClient {
    const rc = new RelayClient(aClient, this.clientCount++, this);
    this.clients.push(rc);
    return rc;
  }

  public getClient(aClient: WebSocket): RelayClient | null {
    for (const rc of this.clients) {
      if (rc.client === aClient) {
        return rc;
      }
    }
    return null;
  }

  public repeat(message: ButtplugMessage) {
    console.log("ButtplugRelayServer", "repeating msg: " + message.toJSON());
    const bpMessage = "[" + message.toJSON() + "]";
    const relayMessage = JSON.stringify({type: "buttplug", message: bpMessage});
    try {
      for (const wsc of this.clients) {
        if (wsc.type === RelayClientType.BUTTPLUG_CLIENT) {
          wsc.client.send(bpMessage);
        } else if (wsc.type === RelayClientType.RELAY_CLIENT) {
          wsc.client.send(relayMessage);
        }
      }
    } catch (e) {
      console.error(e);
    }
  }
}

export default RelayRoom;
