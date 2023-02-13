import Homey from 'homey';
import VeSyncPurifier from '../../tsvesync/veSyncPurifier';
import VeSync from '../../tsvesync/veSync';
import VeSyncDeviceInterface from "../../lib/VeSyncDeviceInterface";
import VeSyncApp from "../../app";

class Core200S extends Homey.Device implements VeSyncDeviceInterface {
    device!: VeSyncPurifier;
    private updateInterval!: NodeJS.Timer;


    /**
     * onInit is called when the device is initialized.
     */
    async onInit() {
        await this.getDevice().catch(this.log);
        this.registerCapabilityListener("onoff", async (value) => await this.setMode(value ? "on" : "off"));
        this.registerCapabilityListener("core200sCapability", async (value) => await this.setMode(value));
        this.registerFlows();

        await this.updateDevice();
        this.updateInterval = setInterval(async () => this.updateDevice(), 1000 * 60);

        if (!this.hasCapability("measure_filter_life"))
            await this.addCapability("measure_filter_life");

        if (!this.hasCapability("alarm_filter_life"))
            await this.addCapability("alarm_filter_life");

        this.log('Core200S has been initialized');
    }

    async setMode(value: string) {
        if (!this.device.isConnected()) {
            this.error("Core200S is not connected");
            return;
        }
        this.log("Mode: " + value);
        if (value === "on" || value === "manual") {
            this.device?.toggleSwitch(true).catch(this.error);
            this.setCapabilityValue('onoff', true).catch(this.error);
            this.setCapabilityValue('core200sCapability', ["low", "medium", "high"][this.device.level - 1 ?? 1] ?? "low").catch(this.error);
            return;
        }
        if (value === "off") {
            this.device?.toggleSwitch(false).catch(this.error);
            this.setCapabilityValue('onoff', false).catch(this.error);
            this.setCapabilityValue('core200sCapability', "off").catch(this.error);
            return;
        }
        if (value === "high") {
            this.device?.setFanSpeed(3).catch(this.error);
            this.setCapabilityValue('onoff', true).catch(this.error);
            return;
        }
        if (value === "medium") {
            this.device?.setFanSpeed(2).catch(this.error);
            this.setCapabilityValue('onoff', true).catch(this.error);
            return;
        }
        if (value === "low") {
            this.device?.setFanSpeed(1).catch(this.error);
            this.setCapabilityValue('onoff', true).catch(this.error);
            return;
        }
        if (value === "sleep") {
            if (this.device?.deviceStatus === 'off')
                this.device?.on().catch(this.error);
            this.device?.setMode('sleep').catch(this.error);
            this.setCapabilityValue('onoff', true).catch(this.error);
            return;
        }
        this.error("Unknown Mode: " + value);
    }

    public async getDevice(): Promise<void> {
        return new Promise(async (resolve, reject) => {
            let veSync: VeSync = (this.homey.app as VeSyncApp).veSync;
            if (veSync === null || !veSync.isLoggedIn()) {
                await this.setUnavailable(this.homey.__("devices.failed_login"));
                return reject("Failed to login. Please use the repair function.");
            }
            let device = veSync.getStoredDevice().find(d => d.uuid === this.getData().id);
            if (device === undefined || !(device instanceof VeSyncPurifier)) {
                this.error("Device is undefined or is not a Core200S");
                await this.setUnavailable(this.homey.__("devices.not_found"));
                return reject("Device is undefined or is not a Core200S");
            }
            this.device = device as VeSyncPurifier;
            if (this.device.isConnected()) {
                await this.setAvailable();
                return resolve();
            }
            await this.setUnavailable(this.homey.__("devices.offline"))
            return reject("Cannot get device status. Device is " + this.device.connectionStatus);
        })
    }

    async updateDevice(): Promise<void> {
        //Getting latest device status
        await this.device.getStatus().catch(this.error);
        if (this.device.isConnected()) {
            if (!this.getAvailable()) {
                await this.setAvailable().catch(this.error);
            }
            this.setCapabilityValue('onoff', this.device.isOn()).catch(this.error);
            if (this.hasCapability("core200sCapability") && this.device.isOn()) {
                if (this.device.mode === "manual") {
                    this.setCapabilityValue('core200sCapability',
                        ["low", "medium", "high"][this.device.level - 1 ?? 1] ?? "low").catch(this.error);
                } else if (this.device.mode === "sleep")
                    this.setCapabilityValue('core200sCapability', "sleep").catch(this.error);
                else if (this.device.mode === "auto")
                    this.setCapabilityValue('core200sCapability', "auto").catch(this.error);
            }

            if (this.hasCapability("measure_pm25") && this.device.getDeviceFeatures().features.includes('air_quality'))
                await this.setCapabilityValue('measure_pm25', this.device.air_quality_value)
            if (this.hasCapability("measure_filter_life"))
                this.setCapabilityValue("measure_filter_life", this.device.filter_life).catch(this.error);
            if (this.hasCapability("alarm_filter_life")) {
                this.setCapabilityValue("alarm_filter_life", this.device.filter_life < 5).catch(this.error);
                if (this.device.filter_life < 5) await this.homey.flow.getTriggerCard("filter_life_low").trigger();
            }
        } else if (this.getAvailable()) {
            await this.setUnavailable(this.homey.__("devices.offline")).catch(this.error);
            await this.setCapabilityValue('onoff', false).catch(this.error);
        }

        this.log("Updating device status!");
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
