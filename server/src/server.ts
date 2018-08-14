import * as express from 'express';
import * as expressWs from 'express-ws';
import RelayRoom from './RelayRoom';
import {
  ButtplugServer,
  FromJSON,
  Error as ButtplugError,
  ButtplugMessage,
  RequestServerInfo,
  ErrorClass, Device, ButtplugDeviceMessage, Ok
} from "buttplug";
import * as Messages from "buttplug/dist/main/src/core/Messages";
import {RelayClientType} from "./RelayClient";

const wsApp = expressWs(express());
const app = wsApp.app;





let rooms: Map<string, RelayRoom> = new Map<string, RelayRoom>();


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
    rs = new RelayRoom();
  }
  let data = `<http><body>${rs.clients.length}</body></http>`;
  res.send(data);
});

app.ws('/:room', function(ws, req) {
  console.log('socket', req.params['room']);
  let room = req.params['room'];
  let rs = rooms.get(room);
  if (rs === undefined) {
    rs = new RelayRoom();
    rs.server.on("message", rs.repeat);
    rooms.set(room, rs);
  }
  rs.addClient(ws);

  ws.on('message',  async (msg) => {
    console.log('message', msg);

    let rs = rooms.get(room);
    if(rs === undefined) {
      return;
    }
    let conn = rs.getClient(ws);
    if (conn === null) {
      conn = rs.addClient(ws);
    }

    let outgoing: Messages.ButtplugMessage | null = null;
    let obj: any = JSON.parse(msg as string);

    try {
      let bmsg: any = null;
      if (obj !== undefined && obj.hasOwnProperty("type") && obj.type === "buttplug") {
        console.log("message", "Embedded BP message");
        bmsg = FromJSON(obj.message);
      } else {
        bmsg = FromJSON(msg);
      }
      if (bmsg.length > 0 && (bmsg[0] instanceof ButtplugError)) {
        if ((bmsg[0] as ButtplugError).ErrorCode === ErrorClass.ERROR_MSG &&
          (bmsg[0] as ButtplugError).Id === 0) {
          throw new Error((bmsg[0] as ButtplugError).ErrorMessage);
        }
      }
      for (const m of bmsg) {
        console.log("message", "Valid BP message");
        if (m instanceof RequestServerInfo) {
          for (let wsc of rs.clients) {
            if (wsc === conn) {
              wsc.type = RelayClientType.BUTTPLUG_CLIENT;
            } else if (wsc.type === RelayClientType.RELAY_CLIENT) {
              wsc.client.send(JSON.stringify({newClient: m.ClientName}));
            }
          }
        }

        outgoing = await rs.server.SendMessage(m);
        console.log("response", "[" + outgoing.toJSON() + "]");
        ws.send("[" + outgoing.toJSON() + "]");
      }
    } catch {
      conn.type = RelayClientType.RELAY_CLIENT;
    }

    if (outgoing === null && obj !== undefined && obj.hasOwnProperty("type") && obj.type === "relay") {
      console.log('message', "Alt message");
      try {
        const msg = obj.message;
        if (msg.hasOwnProperty("deviceAdded")) {
          let device = new Device(msg.deviceAdded.index, msg.deviceAdded.name, msg.deviceAdded.allowedMsgs);
          conn.deviceAdded(device);
        } else if (msg.hasOwnProperty("deviceRemoved")) {
          let device = new Device(msg.deviceRemoved.index, msg.deviceRemoved.name, msg.deviceRemoved.allowedMsgs);
          conn.deviceRemoved(device);
        }
      } catch (ex) {
        // no-op
        console.error(ex);
      }
    }

    for (let wsc of rs.clients) {
      if(wsc.type === RelayClientType.RELAY_CLIENT) {
        wsc.client.send((wsc === conn ? "(echo) " : "") + msg);
        if(outgoing !== null) {
          wsc.client.send("response: [" + outgoing.toJSON() + "]");
        }
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