"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var RelayDevice_1 = require("./RelayDevice");
var RelayClientType;
(function (RelayClientType) {
    RelayClientType[RelayClientType["UNKNOWN"] = 0] = "UNKNOWN";
    RelayClientType[RelayClientType["BUTTPLUG_CLIENT"] = 1] = "BUTTPLUG_CLIENT";
    RelayClientType[RelayClientType["RELAY_CLIENT"] = 2] = "RELAY_CLIENT";
})(RelayClientType || (RelayClientType = {}));
exports.RelayClientType = RelayClientType;
var RelayClient = /** @class */ (function () {
    function RelayClient(aClient, aId, aServer) {
        this.msgId = 0;
        this.type = RelayClientType.UNKNOWN;
        this.devices = [];
        this.exDevices = [];
        this.client = aClient;
        this.id = aId;
        this.server = aServer;
    }
    RelayClient.prototype.deviceAdded = function (aDevice) {
        if (this.devices.findIndex(function (d) { return d.ClientDevice.Index === aDevice.Index; }) === -1) {
            var dev = this.exDevices.find(function (d) { return d.ClientDevice.Index === aDevice.Index; });
            if (dev !== undefined) {
                this.exDevices.splice(this.devices.findIndex(function (d) { return d.ClientDevice.Index === aDevice.Index; }), 1);
            }
            if (dev === undefined || dev.ClientDevice.Name !== aDevice.Name) {
                dev = new RelayDevice_1.default(this, aDevice);
            }
            this.devices.push(dev);
            this.server.devManager.emit("relayDeviceAdded", dev);
        }
    };
    RelayClient.prototype.deviceRemoved = function (aDevice) {
        var dev = this.devices.find(function (d) { return d.ClientDevice.Index === aDevice.Index; });
        if (dev !== undefined) {
            this.exDevices.push(dev);
            this.devices.splice(this.devices.findIndex(function (d) { return d.ClientDevice.Index === aDevice.Index; }), 1);
            this.server.devManager.emit("relayDeviceRemoved", dev);
        }
    };
    return RelayClient;
}());
exports.RelayClient = RelayClient;
