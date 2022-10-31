import Homey from 'homey';
import VeSync from "../../vesync/veSync";
import VeSyncHumidifier from "../../vesync/veSyncHumidifier";

class Classic300s extends Homey.Device {
    private device: VeSyncHumidifier | undefined;

    /**
     * onInit is called when the device is initialized.
     */
    async onInit() {
        await this.getDevice();
        this.registerCapabilityListener("onoff", async (value) => await this.setMode(value ? "on" : "off"));
        this.registerCapabilityListener("classic300sCapability", async (value) => await this.setMode(value));
        this.log("Setting old mode...")
        await this.setMode(this.device?.mode ?? "off");
        this.registerFlows()
        this.log('Classic300s has been initialized');
    }

    private async setMode(value:string) {
        if (this.device == undefined) {
            await this.getDevice();
            this.log(`Device was undefined and now is ` + this.device === undefined ? "undefined" : "defined");
        }
        if(value === "on" || value === "manual") {
            this.device?.toggleSwitch(true).catch(this.error);
            this.setCapabilityValue('onoff', true).catch(this.error);
            this.setCapabilityValue('classic300sCapability', ["low", "medium", "high"][this.device?.extension.mist_level - 1 ?? 1] ?? "low").catch(this.error);
        } else if(value === "off"){
            this.device?.toggleSwitch(false).catch(this.error);
            this.setCapabilityValue('onoff', false).catch(this.error);
            this.setCapabilityValue('classic300sCapability', "off").catch(this.error);
        } else if (value === "high") {
            this.device?.setMistLevel(3).catch(this.error);
            this.setCapabilityValue('onoff', true).catch(this.error);
        } else if (value === "medium") {
            this.device?.setMistLevel(2).catch(this.error);
            this.setCapabilityValue('onoff', true).catch(this.error);
        } else if (value === "low") {
            this.device?.setMistLevel(1).catch(this.error);
            this.setCapabilityValue('onoff', true).catch(this.error);
        } else if (value === "auto") {
            if (this.device?.deviceStatus === 'off')
                this.device.on().catch(this.error);
            this.device?.setAutoMode().catch(this.error);
            this.setCapabilityValue('onoff', true).catch(this.error);
        } else if (value === "sleep") {
            if (this.device?.deviceStatus === 'off')
                this.device.on().catch(this.error);
            this.device?.setHumidityMode('sleep').catch(this.error);
            this.setCapabilityValue('onoff', true).catch(this.error);
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
        if (device === undefined || !(device instanceof VeSyncHumidifier)) {
            this.error("Device is undefined or is not a Classic300s");
            this.setUnavailable("Device is undefined or is not a Classic300s. Re-add this device.").then();
            return;
        }
        await device.getStatus();
        if(VeSync.debugMode) this.log(device, device.extension)
        this.device = device as VeSyncHumidifier;
        await this.setAvailable();
    }

    public registerFlows(): void {
        this.homey.flow.getActionCard("setModeClassic300s").registerRunListener(async (args) => await this.setMode(args.mode));
    }

    /**
     * onAdded is called when the user adds the device, called just after pairing.
     */
    async onAdded() {
        this.log('Classic300s has been added');
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
        this.log('Classic300s settings where changed');
    }

    /**
     * onRenamed is called when the user updates the device's name.
     * This method can be used this to synchronise the name to the device.
     * @param {string} name The new name
     */
    async onRenamed(name: string) {
        this.log('Classic300s was renamed');
    }

    /**
     * onDeleted is called when the user deleted the device.
     */
    async onDeleted() {
        this.log('Classic300s has been deleted');
    }

}

module.exports = Classic300s;
