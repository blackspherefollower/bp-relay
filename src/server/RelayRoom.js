"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var buttplug_1 = require("buttplug");
var RelayClient_1 = require("./RelayClient");
var RelayDeviceManager_1 = require("./RelayDeviceManager");
var RelayRoom = /** @class */ (function () {
    function RelayRoom() {
        var _this = this;
        this.clientCount = 0;
        this.clients = [];
        this.devManager = new RelayDeviceManager_1.default(this);
        this.server = new buttplug_1.ButtplugServer();
        this.server.AddDeviceManager(this.devManager);
        this.server.addListener("message", function (msg) { return _this.repeat(msg); });
    }
    RelayRoom.prototype.addClient = function (aClient) {
        var rc = new RelayClient_1.RelayClient(aClient, this.clientCount++, this);
        this.clients.push(rc);
        return rc;
    };
    RelayRoom.prototype.getClient = function (aClient) {
        for (var _i = 0, _a = this.clients; _i < _a.length; _i++) {
            var rc = _a[_i];
            if (rc.client === aClient) {
                return rc;
            }
        }
        return null;
    };
    RelayRoom.prototype.repeat = function (message) {
        console.log("ButtplugRelayServer", "repeating msg: " + message.toJSON());
        var bpMessage = "[" + message.toJSON() + "]";
        var relayMessage = JSON.stringify({ type: "buttplug", message: bpMessage });
        try {
            for (var _i = 0, _a = this.clients; _i < _a.length; _i++) {
                var wsc = _a[_i];
                if (wsc.type === RelayClient_1.RelayClientType.BUTTPLUG_CLIENT) {
                    wsc.client.send(bpMessage);
                }
                else if (wsc.type === RelayClient_1.RelayClientType.RELAY_CLIENT) {
                    wsc.client.send(relayMessage);
                }
            }
        }
        catch (e) {
            console.error(e);
        }
    };
    return RelayRoom;
}());
exports.default = RelayRoom;
