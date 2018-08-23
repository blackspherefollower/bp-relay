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
  Device,
  ButtplugDeviceMessage,
  Ok,
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
    rs = new RelayRoom();
    rooms.set(room, rs);
  }
  rs.addClient(ws);

  ws.on("message",  async (msg) => {
    console.log("message", msg);

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
        console.log("message", "Valid BP message");
        if (m instanceof RequestServerInfo) {
          for (const wsc of rs0.clients) {
            if (wsc === conn) {
              wsc.type = RelayClientType.BUTTPLUG_CLIENT;
            } else if (wsc.type === RelayClientType.RELAY_CLIENT) {
              wsc.client.send(JSON.stringify({newClient: m.ClientName}));
            }
          }
        }

        outgoing = await rs0.server.SendMessage(m);
        console.log("response", "[" + outgoing.toJSON() + "]");
        ws.send("[" + outgoing.toJSON() + "]");
      }
    } catch {
      conn.type = RelayClientType.RELAY_CLIENT;
    }

    if (outgoing === null && obj !== undefined && obj.hasOwnProperty("type") && obj.type === "relay") {
      console.log("message", "Alt message");
      try {
        const rmsg = obj.message;
        if (rmsg.hasOwnProperty("deviceAdded")) {
          const device = new Device(rmsg.deviceAdded.index, rmsg.deviceAdded.name, rmsg.deviceAdded.allowedMsgs);
          conn.deviceAdded(device);
        } else if (rmsg.hasOwnProperty("deviceRemoved")) {
          const device = new Device(rmsg.deviceRemoved.index, rmsg.deviceRemoved.name, rmsg.deviceRemoved.allowedMsgs);
          conn.deviceRemoved(device);
        }
      } catch (ex) {
        // no-op
        console.error(ex);
      }
    }

    for (const wsc of rs0.clients) {
      if (wsc.type === RelayClientType.RELAY_CLIENT) {
        wsc.client.send((wsc === conn ? "(echo) " : "") + msg);
        if (outgoing !== null) {
          wsc.client.send("response: [" + outgoing.toJSON() + "]");
        }
      }
    }
  });
  ws.on("close", function(msg) {
    console.log("close", msg);
    const rs0 = rooms.get(room);
    if (rs0 !== undefined) {
      const idx = rs0.clients.findIndex((c) => c.client === ws);
      rs0.clients.splice(idx, 1);
      if (rs0.clients.length <= 0) {
        rooms.delete(room);
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
        console.log("response", "Ok for no room");
        res.send("[" + new Ok(4).toJSON() + "]");
        return;
      }
      const outgoing = await rs.server.SendMessage(m);
      console.log("response", "[" + outgoing.toJSON() + "]");
      if (bmsg.length > 0 && (bmsg[0] instanceof ButtplugError)) {
        res.status(400);
      }
      res.send("[" + outgoing.toJSON() + "]");
      return;
    }
  } catch (ex) {
    console.log("error", ex);
    res.status(400);
    res.send("[" + new ButtplugError(ex) + "]");
    return;
  }
});

app.listen(port, (err: any) => {
  if (err) {
    return console.log(err);
  }

  return console.log(`server is listening on ${port}`);
});
