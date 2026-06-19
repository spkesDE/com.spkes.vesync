import Homey from "homey";
import type BasicDevice from "../tsvesync/lib/BasicDevice";

type StoredVeSyncDeviceData = {
    id?: string;
    uuid?: string;
    cid?: string;
    macID?: string;
    macId?: string;
};

export default class HomeyDeviceBase extends Homey.Device {
    protected findStoredVeSyncDevice(devices: BasicDevice[]): BasicDevice | undefined {
        const data = this.getData() as StoredVeSyncDeviceData;
        const physicalUuid = data.uuid ?? data.id;
        const macID = data.macID ?? data.macId;

        return devices.find((storedDevice) => {
            const device = storedDevice?.device;
            if (!device) return false;
            if (physicalUuid && device.uuid !== physicalUuid) return false;
            if (data.cid && device.cid !== data.cid) return false;
            if (macID && device.macID !== macID) return false;
            return Boolean(physicalUuid || data.cid || macID);
        });
    }

    protected async checkForCapability(capability: string): Promise<void> {
        if (!this.hasCapability(capability)) {
            await this.addCapability(capability).catch(this.error);
        }
    }

    protected async setCapabilityIfPresent(capability: string, value: string | number | boolean): Promise<void> {
        if (this.hasCapability(capability)) {
            await this.setCapabilityValue(capability, value).catch(this.error);
        }
    }

    protected async markDeviceOffline(): Promise<void> {
        const wasAvailable = this.getAvailable();
        await this.setUnavailable(this.homey.__("devices.offline")).catch(this.error);
        if (wasAvailable) {
            await this.homey.flow.getDeviceTriggerCard("device_offline").trigger(this).catch(this.error);
        }
    }
}
