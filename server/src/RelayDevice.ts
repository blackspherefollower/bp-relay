import {ButtplugDeviceMessage, ButtplugMessage, Ok, Device} from "buttplug";
import {EventEmitter} from "events";
import {IButtplugDevice} from "buttplug/dist/main/src/server/IButtplugDevice";
import {RelayClient} from "./RelayClient";

class RelayDevice extends EventEmitter implements IButtplugDevice {
  AllowedMessageTypes: string[] = [];
  Id: string = "";
  MessageSpecifications: any = {};
  Name: string = "-1";
  Client: RelayClient;
  ClientDevice: Device;

  constructor(aClient: RelayClient, aDevice: Device) {
    super();
    this.Client = aClient;
    this.ClientDevice = aDevice;
    this.Name = aDevice.Name;
    this.AllowedMessageTypes = aDevice.AllowedMessages;
    for (const m of aDevice.AllowedMessages) {
      this.MessageSpecifications[m] = aDevice.MessageAttributes(m);
    }
  }

  Disconnect(): any {
    this.emit("deviceremoved");
  }

  ParseMessage(aMsg: ButtplugDeviceMessage): Promise<ButtplugMessage> {
    console.log("RelayDevice", "Sending onward command: " + aMsg.toJSON());
    let msgId = this.Client.msgId++;
    let clientMsgId = aMsg.Id;
    aMsg.Id = msgId;
    aMsg.DeviceIndex = this.ClientDevice.Index;
    this.Client.client.send(JSON.stringify({type: "buttplug", message: "[" + aMsg.toJSON() + "]"}));
    return new Promise<ButtplugMessage>(() => new Ok(clientMsgId));
  }

}

export default RelayDevice;