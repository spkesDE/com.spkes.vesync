import Homey from "homey";

export default class HomeyDeviceBase extends Homey.Device {
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
