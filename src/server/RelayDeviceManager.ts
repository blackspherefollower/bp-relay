import {EventEmitter} from "events";
import {IDeviceSubtypeManager} from "buttplug/dist/main/src/server/IDeviceSubtypeManager";
import RelayRoom from "./RelayRoom";

class RelayDeviceManager extends EventEmitter implements IDeviceSubtypeManager {
  public server: RelayRoom;
  public devCount: number = 0;

  private isScanning: boolean = false;

  constructor(server: RelayRoom) {
    super();
    this.server = server;

    this.addListener("relayDeviceAdded", (device) => {
      this.DeviceAdded(device);
    });
    this.addListener("relayDeviceRemoved", (device) => {
      this.DeviceRemoved(device);
    });
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

  private DeviceAdded = async (device: any): Promise<void> => {
    if (device === undefined) {
      return;
    }
    console.log("ButtplugRelayDevMan", "relayDeviceAdded");
    this.emit("deviceadded", device);
  }

  private DeviceRemoved = async (device: any): Promise<void> => {
    if (device === undefined) {
      return;
    }
    console.log("ButtplugRelayDevMan", "relayDeviceRemoved");
    this.emit("deviceremoved", device);
  }
}

export default RelayDeviceManager;
