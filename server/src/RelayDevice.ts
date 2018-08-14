import {ButtplugDeviceMessage, ButtplugMessage, Ok} from "buttplug";
import {EventEmitter} from "events";
import {IButtplugDevice} from "buttplug/dist/main/src/server/IButtplugDevice";

class RelayDevice extends EventEmitter implements IButtplugDevice {
  AllowedMessageTypes: string[] = [];
  Id: string = "";
  MessageSpecifications: object = {};
  Name: string = "";

  constructor(aId: number, aName: string, aMessages: object) {
    super();
    this.Id = aId.toString();
    this.Name = aName;
    this.AllowedMessageTypes = Object.keys(aMessages);
    this.MessageSpecifications = aMessages;
  }

  Disconnect(): any {
    this.emit("deviceremoved");
  }

  ParseMessage(aMsg: ButtplugDeviceMessage): Promise<ButtplugMessage> {
    return Promise.resolve(new Ok(aMsg.Id));
  }

}

export default RelayDevice;