import * as express from "express";
import * as expressWs from "express-ws";
import * as bodyParser from "body-parser";
import RelayRoom from "./RelayRoom";
import {
  ButtplugServer,
  FromJSON,
  Error as ButtplugError,
  ButtplugMessage,
  RequestServerInfo,
  ErrorClass,
  ButtplugServerForwardedConnector, ForwardedDeviceManager,
  ButtplugDeviceMessage,
  Ok, ButtplugDevice, ButtplugClientDevice,
  Ping,
  ServerInfo,
} from "buttplug";
import * as Messages from "buttplug/dist/main/src/core/Messages";
import {RelayClientType} from "./RelayClient";
import * as path from "path";

const port = process.env.PORT || 3000;

const ex = express();
const wsApp = expressWs(ex);
const app = wsApp.app;

const rooms: Map<string, RelayRoom> = new Map<string, RelayRoom>();

app.use((req, res, next) => {
  bodyParser.json()(req, res, (err) => {
    if (err) {
      console.log("bodyparser", err.message);
      res.status(400);
      res.send("[" + new ButtplugError(err.message, ErrorClass.ERROR_MSG, 0).toJSON() + "]");
      return;
    }
    next();
  });
});

app.get("/dist/:file", function(req, res) {
  console.log("GET", "JS " + req.params.file);
  if (req.params.file.startsWith("build.js")) {
    res.sendFile(path.join(__dirname + "/../dist/" + req.params.file));
    return;
  }
  res.status(404).send("Sorry can't find that!");
});

app.get("/", function(req, res) {
  console.log("GET", "root");
  res.sendFile(path.join(__dirname + "/../index.html"));
});

app.get("/:room", function(req, res) {
  console.log("GET", "room: " + req.params.room);
  res.sendFile(path.join(__dirname + "/../index.html"));
});

app.ws("/:room", function(ws, req) {
  console.log("socket", req.params.room);
  const room = req.params.room;
  let rs = rooms.get(room);
  if (rs === undefined) {
    rs = new RelayRoom(room);
    rooms.set(room, rs);
  }
  rs.addClient(ws);

  ws.on("message",  async (msg) => {
    const rs0 = rooms.get(room);
    if (rs0 === undefined) {
      return;
    }
    let conn = rs0.getClient(ws);
    if (conn === null) {
      conn = rs0.addClient(ws);
    }

    let outgoing: Messages.ButtplugMessage | null = null;
    const obj: any = JSON.parse(msg as string);

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
        if (m instanceof RequestServerInfo) {
          console.log("message", msg);
          console.log("message", "Valid BP RequestServerInfo message");
          for (const wsc of rs0.clients) {
            if (wsc === conn) {
              wsc.type = RelayClientType.BUTTPLUG_CLIENT;
              wsc.isButtplugClient();
            } else if (wsc.type === RelayClientType.RELAY_CLIENT) {
              wsc.send(JSON.stringify({newClient: m.ClientName}));
            }
          }
        }

        if (conn.bpserver !== null) {
          outgoing = await conn.bpserver.SendMessage(m);
        } else {
          outgoing = new ButtplugError("No server!");
        }
        if (!(m instanceof Ping)) {
          console.log("response", "[" + outgoing.toJSON() + "]");
        }
        ws.send("[" + outgoing.toJSON() + "]");
      }
    } catch {
      conn.type = RelayClientType.RELAY_CLIENT;
    }

    if (outgoing === null && obj !== undefined && obj.hasOwnProperty("type") && obj.type === "relay") {
      console.log("message", msg);
      console.log("message", "Alt message");
      try {
        const rmsg = obj.message;
        if (rmsg.hasOwnProperty("deviceAdded")) {
          const device = new ButtplugClientDevice(rmsg.deviceAdded.index, rmsg.deviceAdded.name, rmsg.deviceAdded.allowedMsgs, async () => {});
          conn.deviceAdded(device);
        } else if (rmsg.hasOwnProperty("deviceRemoved")) {
          const device = new ButtplugClientDevice(rmsg.deviceRemoved.index, rmsg.deviceRemoved.name, rmsg.deviceRemoved.allowedMsgs, async () => {});
          conn.deviceRemoved(device);
        }
      } catch (ex) {
        // no-op
        console.error(ex);
      }
    }

    for (const wsc of rs0.clients) {
      if (wsc.type === RelayClientType.RELAY_CLIENT) {
        wsc.send((wsc === conn ? "(echo) " : "") + msg);
        if (outgoing !== null) {
          wsc.send("response: [" + outgoing.toJSON() + "]");
        }
      }
    }
  });
  ws.on("close", function(msg) {
    console.log("close", msg);
    const rs0 = rooms.get(room);
    if (rs0 !== undefined) {
      const idx = rs0.clients.findIndex((c) => c.client === ws);
      const del = rs0.clients.splice(idx, 1);
      if (rs0.clients.length <= 0) {
        rooms.delete(room);
      }
      for (const c of del) {
        try {
          if (c.bpserver !== null) {
            c.bpserver.ClearDeviceManagers();
          }
          if (c.client !== null) {
            c.client.close();
          }
        } catch (e) {
          // no-op
        }
      }
    }
  });
  ws.on("error", function(msg) {
    console.log("error", msg);
  });
});

app.post("/:room", async function(req, res) {
  console.log("post", req.params.room + " - " + JSON.stringify(req.body));
  const room = req.params.room;
  const body = JSON.stringify(req.body);

  try {
    const bmsg = FromJSON(body);
    if (bmsg.length > 0 && (bmsg[0] instanceof ButtplugError)) {
      if ((bmsg[0] as ButtplugError).ErrorCode === ErrorClass.ERROR_MSG &&
        (bmsg[0] as ButtplugError).Id === 0) {
        console.log("error", "[" + bmsg[0].toJSON() + "]");
        res.status(400);
        res.send("[" + bmsg[0].toJSON() + "]");
        return;
      }
    }
    for (const m of bmsg) {
      console.log("message", "Valid BP message");
      let rs = rooms.get(room);
      if (rs === undefined) {
        rs = new RelayRoom(room);
        rooms.set(room, rs);
      }
      const conn = rs.addClient(null);
      conn.isButtplugClient();

      if (conn.bpserver !== null) {
        const sInfo = await conn.bpserver.SendMessage(new RequestServerInfo("Buttplug REST relay", 1, 1));
        if (sInfo instanceof ServerInfo) {
          const outgoing = await conn.bpserver.SendMessage(m);
          console.log("response", "[" + outgoing.toJSON() + "]");
          if (bmsg.length > 0 && (bmsg[0] instanceof ButtplugError)) {
            res.status(400);
          }
          res.send("[" + outgoing.toJSON() + "]");
        }
        res.status(500);
        res.send("[" + sInfo.toJSON() + "]");
      } else {
        res.status(500);
        res.send("[" + new ButtplugError("Internal Server Error").toJSON() + "]");
      }

      const idx = rs.clients.findIndex((c) => c.id === conn.id);
      rs.clients.splice(idx, 1);
      if (rs.clients.length <= 0) {
        rooms.delete(room);
      }
      return;
    }
  } catch (ex) {
    console.log("error", ex);
    res.status(400);
    res.send("[" + new ButtplugError(ex) + "]");
    return;
  }
});

app.listen(port);
