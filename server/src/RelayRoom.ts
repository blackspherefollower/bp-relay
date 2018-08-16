import {ButtplugMessage, ButtplugServer} from "buttplug";
import {RelayClient, RelayClientType} from "./RelayClient";
import RelayDeviceManager from "./RelayDeviceManager";
import * as WebSocket from 'ws';

class RelayRoom {
  clientCount: number = 0;
  clients: RelayClient[];
  server: ButtplugServer;
  devManager: RelayDeviceManager;

  constructor() {
    this.clients = [];
    this.devManager = new RelayDeviceManager(this)
    this.server = new ButtplugServer();
    this.server.AddDeviceManager(this.devManager);
    this.server.addListener("message", (msg) => this.repeat(msg));
  }

  addClient(aClient: WebSocket): RelayClient {
    let rc = new RelayClient(aClient, this.clientCount++, this);
    this.clients.push(rc);
    return rc;
  }

  getClient(aClient: WebSocket): RelayClient | null {
    for (let rc of this.clients) {
      if(rc.client === aClient) {
        return rc;
      }
    }
    return null;
  }

  repeat(message: ButtplugMessage) {
    console.log('ButtplugRelayServer', "repeating msg: " + message.toJSON());
    const bpMessage = "[" + message.toJSON() + "]";
    const relayMessage = JSON.stringify({type: "buttplug", message: bpMessage});
    try {
      for (let wsc of this.clients) {
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