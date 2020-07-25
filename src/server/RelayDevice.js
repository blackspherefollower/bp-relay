"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
var buttplug_1 = require("buttplug");
var events_1 = require("events");
var RelayDevice = /** @class */ (function (_super) {
    __extends(RelayDevice, _super);
    function RelayDevice(aClient, aDevice) {
        var _this = _super.call(this) || this;
        _this.AllowedMessageTypes = [];
        _this.Id = "";
        _this.MessageSpecifications = {};
        _this.Name = "-1";
        _this.Client = aClient;
        _this.ClientDevice = aDevice;
        _this.Name = aDevice.Name;
        _this.AllowedMessageTypes = aDevice.AllowedMessages;
        for (var _i = 0, _a = aDevice.AllowedMessages; _i < _a.length; _i++) {
            var m = _a[_i];
            _this.MessageSpecifications[m] = aDevice.MessageAttributes(m);
        }
        return _this;
    }
    RelayDevice.prototype.Disconnect = function () {
        this.emit("deviceremoved");
    };
    RelayDevice.prototype.ParseMessage = function (aMsg) {
        console.log("RelayDevice", "Sending onward command: " + aMsg.toJSON());
        var msgId = this.Client.msgId++;
        var clientMsgId = aMsg.Id;
        aMsg.Id = msgId;
        aMsg.DeviceIndex = this.ClientDevice.Index;
        this.Client.client.send(JSON.stringify({ type: "buttplug", message: "[" + aMsg.toJSON() + "]" }));
        return new Promise(function () { return new buttplug_1.Ok(clientMsgId); });
    };
    return RelayDevice;
}(events_1.EventEmitter));
exports.default = RelayDevice;
