import BasicDevice from "./lib/BasicDevice";
import path from "node:path";
import {glob} from "glob";

export default class DeviceTypeManager {

    private devices: typeof BasicDevice[] = [];

    public async loadDevices() {
        const deviceFiles = glob.sync(path.join(__dirname, 'devices/**/*.{ts,js}').replace(/\\/g,'/'));
        for (const file of deviceFiles) {
            try {
                const deviceModule = await import(file);
                const DeviceClass = deviceModule.default;
                this.devices.push(DeviceClass);
            } catch (error) {
                console.error(`Error loading device module ${file}:`, error);
            }
        }
        console.log(`Total devices loaded: ${this.devices.length}`);
    }
    public getDevices(): typeof BasicDevice[] {
        return this.devices;
    }

    public getDevice(deviceType: string): typeof BasicDevice | undefined {
        return this.devices.find(device => device.hasModel(deviceType));
    }

}