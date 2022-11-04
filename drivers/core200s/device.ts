import Homey from 'homey';
import VeSync from "../../vesync/veSync";
import VeSyncPurifier from "../../vesync/veSyncPurifier";

class Core200S extends Homey.Device {
    private device: VeSyncPurifier | undefined;
    private checkInterval: NodeJS.Timeout | undefined;

    /**
     * onInit is called when the device is initialized.
     */
    async onInit() {
        await this.getDevice().catch(this.log);
        this.registerCapabilityListener("onoff", async (value) => await this.setMode(value ? "on" : "off"));
        this.registerCapabilityListener("core200sCapability", async (value) => await this.setMode(value));
        this.registerFlows();
        this.log('Core200S has been initialized');
    }

    private async setMode(value: string) {
        if (this.device == undefined) {
            await this.getDevice().catch();
            this.log(`Device was undefined and now is ` + this.device === undefined ? "undefined" : "defined");
        }
        if (!this.device?.isConnected()) return;
        this.log("Mode: " + value);
        if (value === "on" || value === "manual") {
            this.device?.toggleSwitch(true).catch(this.handleError.bind(this));
            this.setCapabilityValue('onoff', true).catch(this.error);
            this.setCapabilityValue('core200sCapability', ["low", "medium", "high"][this.device?.extension.fanSpeedLevel - 1 ?? 1] ?? "low").catch(this.error);
        } else if (value === "off") {
            this.device?.toggleSwitch(false).catch(this.handleError.bind(this));
            this.setCapabilityValue('onoff', false).catch(this.error);
            this.setCapabilityValue('core200sCapability', "off").catch(this.error);
        } else if (value === "high") {
            this.device?.setFanSpeed(3).catch(this.handleError.bind(this));
            this.setCapabilityValue('onoff', true).catch(this.error);
        } else if (value === "medium") {
            this.device?.setFanSpeed(2).catch(this.handleError.bind(this));
            this.setCapabilityValue('onoff', true).catch(this.error);
        } else if (value === "low") {
            this.device?.setFanSpeed(1).catch(this.handleError.bind(this));
            this.setCapabilityValue('onoff', true).catch(this.error);
        } else if (value === "sleep") {
            if (this.device?.deviceStatus === 'off')
                this.device?.on().catch(this.handleError.bind(this));
            this.device?.setMode('sleep').catch(this.handleError.bind(this));
            this.setCapabilityValue('onoff', true).catch(this.error);
        }
    }

    public async getDevice(): Promise<void> {
        return new Promise(async (resolve, reject) => {
            // @ts-ignore
            let veSync: VeSync = this.homey.app.veSync;
            if (veSync === null || !veSync.isLoggedIn()) {
                await this.setUnavailable("Failed to login. Please use the repair function.");
                return reject("Failed to login. Please use the repair function.");
            }
            let device = veSync.getStoredDevice().find(d => d.uuid === this.getData().id);
            if (device === undefined || !(device instanceof VeSyncPurifier)) {
                this.error("Device is undefined or is not a Core200S");
                await this.setUnavailable("Device is undefined or is not a Core200S. Re-add this device.");
                return reject("Device is undefined or is not a Core200S");
            }
            this.device = device as VeSyncPurifier;
            if (this.device.isConnected()) {
                await this.device.getStatus().catch(this.handleError.bind(this));
                await this.setAvailable();
                return resolve();
            }
            await this.deviceOffline();
            return reject("Cannot get device status. Device is " + this.device.connectionStatus);
        })
    }

    private async deviceOffline() {
        await this.setUnavailable("Device is offline. Checking every 60 seconds for device availability.").catch(this.error);
        await this.setCapabilityValue('onoff', false).catch(this.error);
        if (this.checkInterval === undefined)
            this.checkInterval = setInterval(async () => {
                await this.device?.getStatus().catch(() => this.log("Still offline...."));
                if (this.device?.isConnected()) {
                    await this.setAvailable().catch(this.error);
                    this.log("Device is online.");
                    if (this.checkInterval !== undefined)
                        clearInterval(this.checkInterval)
                } else if (this.getAvailable()) {
                    await this.setUnavailable("Device is offline. Checking every 60 seconds for device availability.").catch(this.error);
                    await this.setCapabilityValue('onoff', false).catch(this.error);
                }
            }, 60 * 1000)
    }

    private handleError(error: any) {
        if (!this.device?.isConnected())
            this.deviceOffline().catch(this.error);
        else
            this.error(error)
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
