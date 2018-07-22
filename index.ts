import * as express from 'express';
import * as expressWs from 'express-ws';
import * as WebSocket from 'ws';

const wsApp = expressWs(express());
const app = wsApp.app;

class ReplayClient {
    client: WebSocket;

    constructor(aClient: WebSocket) {
        this.client = aClient;
    }
}

let rooms: Map<string, Array<ReplayClient>> = new Map<string, Array<ReplayClient>>();


app.get('/', function(req, res, next){
    let data = "<http><body><ul>";
    rooms.forEach((x, y) => {
        data += `<li>${y} - ${x.length}</li>`;
    });
    data += "</ul></body></http>";
    res.send(data);
});

app.get('/:room', function(req, res, next){
    let room = req.params['room'];
    let clients = rooms.get(room);
    if (clients === undefined) {
        clients = new Array<ReplayClient>();
    }
    let data = `<http><body>${clients.length}</body></http>`;
    res.send(data);
});

app.ws('/:room', function(ws, req) {
    console.log('socket', req.params['room']);
    let room = req.params['room'];
    let clients = rooms.get(room);
    if (clients === undefined) {
        clients = new Array<ReplayClient>();
        rooms.set(room, clients);
    }
    clients.push(new ReplayClient(ws));

    ws.on('message', function(msg) {
        console.log('message', msg);
        let clients = rooms.get(room);
        if(clients === undefined) {
            return;
        }
        clients.forEach( wsc => {
            console.info(wsc.client.url);
            if(wsc.client == ws) {
                // no echo
                return;
            }
            wsc.client.send(msg);
        });
    });
    ws.on('close', function(msg) {
        console.log('close', msg);
        let clients = rooms.get(room);
        if (clients !== undefined) {
            let idx = clients.findIndex(c => c.client === ws);
            clients.splice(idx, 1);
            if(clients.length > 0) {
                rooms.set(room, clients);
            } else {
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