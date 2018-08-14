import {EventEmitter} from "events";
import {IDeviceSubtypeManager} from "buttplug/dist/main/src/server/IDeviceSubtypeManager";
import RelayRoom from "./RelayRoom";

class RelayDeviceManager extends EventEmitter implements IDeviceSubtypeManager {
  isScanning: boolean = false;
  server: RelayRoom;

  constructor(server: RelayRoom) {
    super();
    this.server = server;

    this.on("relayDeviceAdded", (device) => {
      this.DeviceAdded(device);
    });
    this.on("relayDeviceRemoved", (device) => {
      this.DeviceRemoved(device);
    });
  }

private DeviceAdded = async (device: any): Promise<void> => {
    if (device === undefined) {
      return;
    }
    console.log('ButtplugRelayDevMan', 'relayDeviceAdded');
    this.emit("deviceadded", device);
  }

private DeviceRemoved = async (device: any): Promise<void> => {
    if (device === undefined) {
      return;
    }
    console.log('ButtplugRelayDevMan', 'relayDeviceRemoved');
    this.emit("deviceremoved", device);
  }

public StartScanning(): void {
    this.isScanning = true;
}

public StopScanning(): void {
    this.isScanning = false;
}

public get IsScanning(): boolean {
    return this.isScanning;
  }
}

export default RelayDeviceManager;