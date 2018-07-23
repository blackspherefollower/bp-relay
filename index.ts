import * as express from 'express';
import * as expressWs from 'express-ws';
import * as WebSocket from 'ws';
import {
  ButtplugServer,
  FromJSON,
  Error as ButtplugError,
  ButtplugMessage,
  RequestServerInfo,
  ErrorClass, Device
} from "buttplug";

const wsApp = expressWs(express());
const app = wsApp.app;

enum RelayClientType {
  UNKNOWN,
  BUTTPLUG_CLIENT,
  RELAY_CLIENT
}

class RelayClient {
  client: WebSocket;
  type: RelayClientType = RelayClientType.UNKNOWN;
  devices: Device[] = [];

  constructor(aClient: WebSocket) {
    this.client = aClient;
  }
}

class ButtplugRelayServer {
  clients: Array<RelayClient>;
  server: ButtplugServer;

  constructor() {
    this.clients = new Array<RelayClient>();
    this.server = new ButtplugServer();
  }

  repeat(message: ButtplugMessage) {
    for (let wsc of this.clients) {
      wsc.client.send("[" + message.toJSON() + "]");
    }
  }
}

let rooms: Map<string, ButtplugRelayServer> = new Map<string, ButtplugRelayServer>();


app.get('/', function(req, res, next){
  let data = "<http><body><ul>";
  rooms.forEach((x, y) => {
    data += `<li>${y} - ${x.clients.length}</li>`;
  });
  data += "</ul></body></http>";
  res.send(data);
});

app.get('/:room', function(req, res, next){
  let room = req.params['room'];
  let rs = rooms.get(room);
  if (rs === undefined) {
    rs = new ButtplugRelayServer();
  }
  let data = `<http><body>${rs.clients.length}</body></http>`;
  res.send(data);
});

app.ws('/:room', function(ws, req) {
  console.log('socket', req.params['room']);
  let room = req.params['room'];
  let rs = rooms.get(room);
  if (rs === undefined) {
    rs = new ButtplugRelayServer();
    rs.server.on("message", rs.repeat);
    rooms.set(room, rs);
  }
  rs.clients.push(new RelayClient(ws));

  ws.on('message',  async (msg) => {
    console.log('message', msg);

    let rs = rooms.get(room);
    if(rs === undefined) {
      return;
    }
    let conn: RelayClient | null = null;
    for (let wsc of rs.clients) {
      if (wsc.client == ws) {
        conn = wsc;
        break;
      }
    }
    if (conn === null) {
      conn = new RelayClient(ws);
      rs.clients.push(conn);
    }

    try {
      const bmsg = FromJSON(msg);
      if (bmsg.length > 0 && (bmsg[0] instanceof ButtplugError)) {
        if((bmsg[0] as ButtplugError).ErrorCode == ErrorClass.ERROR_MSG && (bmsg[0] as ButtplugError).Id === 0) {
          throw new Error((bmsg[0] as ButtplugError).ErrorMessage);
        }
      }
      for (const m of bmsg) {
        console.log('message', "Valid BP message");
        if(m instanceof RequestServerInfo) {
          for (let wsc of rs.clients) {
            if (wsc === conn) {
              wsc.type = RelayClientType.BUTTPLUG_CLIENT;
            } else if (wsc.type === RelayClientType.RELAY_CLIENT) {
              wsc.client.send(JSON.stringify({newClient: m.ClientName}));
            }
          }
        }

        const outgoing = await rs.server.SendMessage(m);
        ws.send("[" + outgoing.toJSON() + "]");
      }
    } catch {
      conn.type = RelayClientType.RELAY_CLIENT;
    }

    try {
      let obj: object = JSON.parse(msg as string);
      if (obj !== undefined) {
        if (obj.hasOwnProperty("devicedAdded")) {
          let device: Device = obj.devicedAdded as Device;
          conn.devices.indexOf()
        } else if (obj.hasOwnProperty("devicedRemoved")) {

        }
      }
    } catch {
    }

    console.log('message', "Alt message");
    for (let wsc of rs.clients) {
      if(wsc !== conn && wsc.type === RelayClientType.RELAY_CLIENT) {
        wsc.client.send(msg);
      }
    }
  });
  ws.on('close', function(msg) {
    console.log('close', msg);
    let rs = rooms.get(room);
    if (rs !== undefined) {
      let idx = rs.clients.findIndex(c => c.client === ws);
      rs.clients.splice(idx, 1);
      if(rs.clients.length <= 0) {
        rooms.delete(room);
      }
    }
  });
  ws.on('error', function(msg) {
    console.log('error', msg);
  });
  ws.on('error', function(msg) {
    console.log('error', msg);
  });
});

app.listen(3000);