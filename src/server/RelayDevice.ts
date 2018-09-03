import {ButtplugDeviceMessage, ButtplugMessage, Ok, Device} from "buttplug";
import {EventEmitter} from "events";
import {IButtplugDevice} from "buttplug/dist/main/src/server/IButtplugDevice";
import {RelayClient} from "./RelayClient";

class RelayDevice extends EventEmitter implements IButtplugDevice {
  public AllowedMessageTypes: string[] = [];
  public Id: string = "";
  public MessageSpecifications: any = {};
  public Name: string = "-1";
  public Client: RelayClient;
  public ClientDevice: Device;

  constructor(aClient: RelayClient, aDevice: Device, aDevId: number) {
    super();
    this.Id = "" + aDevId;
    this.Client = aClient;
    this.ClientDevice = aDevice;
    this.Name = aDevice.Name;
    this.AllowedMessageTypes = aDevice.AllowedMessages;
    for (const m of aDevice.AllowedMessages) {
      this.MessageSpecifications[m] = aDevice.MessageAttributes(m);
    }
  }

  public Disconnect(): any {
    this.emit("deviceremoved");
  }

  public ParseMessage(aMsg: ButtplugDeviceMessage): Promise<ButtplugMessage> {
    console.log("RelayDevice", "Sending onward command: " + aMsg.toJSON());
    const msgId = this.Client.msgId++;
    const clientMsgId = aMsg.Id;
    aMsg.Id = msgId;
    aMsg.DeviceIndex = this.ClientDevice.Index;
    this.Client.send(JSON.stringify({type: "buttplug", message: "[" + aMsg.toJSON() + "]"}));
    return new Promise<ButtplugMessage>(() => new Ok(clientMsgId));
  }

}

export default RelayDevice;
