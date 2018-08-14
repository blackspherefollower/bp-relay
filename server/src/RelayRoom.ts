import {ButtplugMessage, ButtplugServer} from "buttplug";
import {RelayClient} from "./RelayClient";
import RelayDeviceManager from "./RelayDeviceManager";
import * as WebSocket from 'ws';

class RelayRoom {
  clientCount: number = 0;
  clients: Array<RelayClient>;
  server: ButtplugServer;
  devManager: RelayDeviceManager;

  constructor() {
    this.clients = new Array<RelayClient>();
    this.devManager = new RelayDeviceManager(this)
    this.server = new ButtplugServer();
    this.server.AddDeviceManager(this.devManager);
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
    console.log('ButtplugRelayServer', "repeating msg: " + message);
    for (let wsc of this.clients) {
      wsc.client.send("[" + message.toJSON() + "]");
    }
  }
}

export default RelayRoom;