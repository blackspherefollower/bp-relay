import {EventEmitter} from "events";
import {IDeviceSubtypeManager} from "buttplug/dist/main/src/server/IDeviceSubtypeManager";
import RelayRoom from "./RelayRoom";
import RelayDevice from "./RelayDevice";
import {Device} from "buttplug";
import {RelayClient} from "./RelayClient";

class RelayDeviceManager extends EventEmitter implements IDeviceSubtypeManager {
  public server: RelayRoom;
  public devCount: number = 0;
  public devices: RelayDevice[] = [];
  public exDevices: RelayDevice[] = [];

  private isScanning: boolean = false;

  constructor(server: RelayRoom) {
    super();
    this.server = server;

    this.addListener("relayDeviceAdded", (client, device) => {
      this.DeviceAdded(client, device);
    });
    this.addListener("relayDeviceRemoved", (client, device) => {
      this.DeviceRemoved(client, device);
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

  private DeviceAdded = async (aClient: RelayClient, aDevice: Device): Promise<void> => {
    if (aDevice === undefined) {
      return;
    }
    if (this.devices.findIndex((d) => d.ClientDevice.Index === aDevice.Index && d.Client === aClient) === -1) {
      let dev = this.exDevices.find((d) => d.ClientDevice.Index === aDevice.Index && d.Client === aClient);
      if (dev !== undefined) {
        this.exDevices.splice(this.devices.findIndex((d) =>
          d.ClientDevice.Index === aDevice.Index && d.Client === aClient), 1);
      }
      if (dev === undefined || dev.ClientDevice.Name !== aDevice.Name) {
        dev = new RelayDevice(aClient, aDevice, this.devCount++);
      }
      this.devices.push(dev);

      console.log("ButtplugRelayDevMan", "relayDeviceAdded");
      this.emit("deviceadded", dev);
    }
  }

  private DeviceRemoved = async (aClient: RelayClient, aDevice: Device): Promise<void> => {
    if (aDevice === undefined) {
      return;
    }
    const dev = this.devices.find((d) => d.ClientDevice.Index === aDevice.Index && d.Client === aClient);
    if (dev !== undefined) {
      this.exDevices.push(dev);
      this.devices.splice(this.devices.findIndex((d) =>
        d.ClientDevice.Index === aDevice.Index && d.Client === aClient), 1);

      console.log("ButtplugRelayDevMan", "relayDeviceRemoved");
      this.emit("deviceremoved", dev);
    }
  }
}

export default RelayDeviceManager;
