import BasicDevice from "./lib/BasicDevice";
import path from "node:path";
import {pathToFileURL} from "node:url";
import {glob} from "glob";

export default class DeviceTypeManager {

    private devices: typeof BasicDevice[] = [];

    public async loadDevices() {
        const deviceFiles = glob.sync(path.join(__dirname, 'devices/**/*.{ts,js}').replace(/\\/g,'/'));
        for (const file of deviceFiles) {
            try {
                const deviceModule = await import(pathToFileURL(file).href);
                const DeviceClass = this.resolveDeviceClass(deviceModule);
                if (!DeviceClass || typeof DeviceClass.hasModel !== 'function') {
                    console.error(`Invalid device module loaded from ${file}`);
                    continue;
                }
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
        return this.devices.find(device => typeof device.hasModel === 'function' && device.hasModel(deviceType));
    }

    private resolveDeviceClass(deviceModule: any): typeof BasicDevice | undefined {
        if (typeof deviceModule?.default?.hasModel === 'function') {
            return deviceModule.default;
        }

        if (typeof deviceModule?.default?.default?.hasModel === 'function') {
            return deviceModule.default.default;
        }

        return undefined;
    }

}
