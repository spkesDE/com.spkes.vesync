import Homey from 'homey';
import VeSync from "../../vesync/veSync";
import VeSyncPurifier from "../../vesync/veSyncPurifier";

class Core200S extends Homey.Device {
    private device: VeSyncPurifier | undefined;

    /**
     * onInit is called when the device is initialized.
     */
    async onInit() {
        await this.getDevice();
        this.registerCapabilityListener("onoff", async (value) => await this.setMode(value ? "on" : "off"));
        this.registerCapabilityListener("core200sCapability", async (value) => await this.setMode(value));
        this.log("Setting old mode...")
        await this.setMode(this.device?.mode ?? "off");
        this.registerFlows()
        this.log('Core200S has been initialized');
    }

    private async setMode(value:string) {
        if (this.device == undefined) {
            await this.getDevice();
            this.log(`Device was undefined and now is ` + this.device === undefined ? "undefined" : "defined");
        }
        if(value === "on" || value === "manual") {
            await this.device?.toggleSwitch(true);
            this.setCapabilityValue('onoff', true).catch(this.error);
            this.setCapabilityValue('core200sCapability', ["low", "medium", "high"][this.device?.extension.fanSpeedLevel - 1 ?? 1] ?? "low").catch(this.error);
        } else if(value === "off"){
            await this.device?.toggleSwitch(false);
            this.setCapabilityValue('onoff', false).catch(this.error);
            this.setCapabilityValue('core200sCapability', "off").catch(this.error);
        } else if (value === "high") {
            await this.device?.setFanSpeed(3);
            this.setCapabilityValue('onoff', true).catch(this.error);
        } else if (value === "medium") {
            await this.device?.setFanSpeed(2);
            this.setCapabilityValue('onoff', true).catch(this.error);
        } else if (value === "low") {
            await this.device?.setFanSpeed(1);
            this.setCapabilityValue('onoff', true).catch(this.error);
        } else if (value === "sleep") {
            if (this.device?.deviceStatus === 'off')
                await this.device.on();
            await this.device?.setMode('sleep');
            this.setCapabilityValue('onoff', true).catch(this.error);
        } else if (value === "off") {
            await this.device?.off()
            this.setCapabilityValue('onoff', false).catch(this.error);
        }
        this.log(value);
    }

    public async getDevice() {
        // @ts-ignore
        let veSync: VeSync = this.homey.app.veSync;
        if (veSync === null || !veSync.isLoggedIn()) {
            this.setUnavailable("Failed to login. Please use the repair function").then();
            return;
        }
        let device = veSync.getStoredDevice().find(d => d.uuid === this.getData().id);
        if (device === undefined || !(device instanceof VeSyncPurifier)) {
            this.error("Device is undefined or is not a Core200S");
            this.setUnavailable("Device is undefined or is not a Core200S. Re-add this device.").then();
            return;
        }
        await device.getStatus();
        this.device = device as VeSyncPurifier;
        await this.setAvailable();
    }

    public registerFlows(): void {
        this.homey.flow.getActionCard("setModeCore200s").registerRunListener(async (args) => await this.setMode(args.mode));
    }

    /**
     * onAdded is called when the user adds the device, called just after pairing.
     */
    async onAdded() {
        this.log('Core200S has been added');
    }

    /**
     * onSettings is called when the user updates the device's settings.
     * @param {object} event the onSettings event data
     * @param {object} event.oldSettings The old settings object
     * @param {object} event.newSettings The new settings object
     * @param {string[]} event.changedKeys An array of keys changed since the previous version
     * @returns {Promise<string|void>} return a custom message that will be displayed
     */
    async onSettings({oldSettings: {}, newSettings: {}, changedKeys: []}): Promise<string | void> {
        this.log('Core200S settings where changed');
    }

    /**
     * onRenamed is called when the user updates the device's name.
     * This method can be used this to synchronise the name to the device.
     * @param {string} name The new name
     */
    async onRenamed(name: string) {
        this.log('Core200S was renamed');
    }

    /**
     * onDeleted is called when the user deleted the device.
     */
    async onDeleted() {
        this.log('Core200S has been deleted');
    }

}

module.exports = Core200S;
