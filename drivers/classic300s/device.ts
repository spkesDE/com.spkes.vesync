import Homey from 'homey';
import VeSync from '../../tsvesync/veSync';
import VeSyncHumidifier from '../../tsvesync/veSyncHumidifier';
import VeSyncDeviceInterface from "../../lib/VeSyncDeviceInterface";
import VeSyncApp from "../../app";


class Classic300s extends Homey.Device implements VeSyncDeviceInterface {
    device!: VeSyncHumidifier;
    private updateInterval!: NodeJS.Timer;

    /**
     * onInit is called when the device is initialized.
     */
    async onInit() {
        await this.getDevice();
        this.registerCapabilityListener("onoff", async (value) => await this.setMode(value ? "on" : "off"));
        this.registerCapabilityListener("classic300sCapability", async (value) => await this.setMode(value));
        this.registerFlows()
        await this.updateDevice();
        this.updateInterval = setInterval(async () => this.updateDevice(), 1000 * 60);
        this.log('Classic300s has been initialized');
    }

    async getDevice(): Promise<void> {
        return new Promise(async (resolve, reject) => {
            let veSync: VeSync = (this.homey.app as VeSyncApp).veSync;
            if (veSync === null || !veSync.isLoggedIn()) {
                await this.setUnavailable(this.homey.__("devices.failed_login"));
                return reject("Failed to login. Please use the repair function.");
            }
            let device = veSync.getStoredDevice().find(d => d.uuid === this.getData().id);
            if (device === undefined || !(device instanceof VeSyncHumidifier)) {
                this.error("Device is undefined or is not a Classic300s");
                await this.setUnavailable(this.homey.__("devices.not_found"));
                return reject("Device is undefined or is not a Classic300s");
            }
            this.device = device as VeSyncHumidifier;
            if (this.device.isConnected()) {
                await this.setAvailable();
                return resolve();
            }
            await this.setUnavailable(this.homey.__("devices.offline"));
            return reject("Cannot get device status. Device is " + this.device.connectionStatus);
        })
    }

    async setMode(value: string) {
        if (!this.device.isConnected()) {
            this.error("Classic300s is not connected");
            return;
        }
        if (!this.device?.isConnected()) return;
        if (value === "on" || value === "manual") {
            this.device?.toggleSwitch(true).catch(this.error);
            this.setCapabilityValue('onoff', true).catch(this.error);
            this.setCapabilityValue('classic300sCapability', ["low", "medium", "high"][this.device?.mist_level - 1 ?? 1] ?? "low").catch(this.error);
            return;
        }
        if (value === "off") {
            this.device?.toggleSwitch(false).catch(this.error);
            this.setCapabilityValue('onoff', false).catch(this.error);
            this.setCapabilityValue('classic300sCapability', "off").catch(this.error);
            return;
        }
        if (value === "high") {
            this.device?.setMistLevel(3).catch(this.error);
            this.setCapabilityValue('onoff', true).catch(this.error);
            return;
        }
        if (value === "medium") {
            this.device?.setMistLevel(2).catch(this.error);
            this.setCapabilityValue('onoff', true).catch(this.error);
            return;
        }
        if (value === "low") {
            this.device?.setMistLevel(1).catch(this.error);
            this.setCapabilityValue('onoff', true).catch(this.error);
            return;
        }
        if (value === "auto") {
            if (this.device?.deviceStatus === 'off')
                this.device.on().catch(this.error);
            this.device?.setAutoMode().catch(this.error);
            this.setCapabilityValue('onoff', true).catch(this.error);
            return;
        }
        if (value === "sleep") {
            if (this.device?.deviceStatus === 'off')
                this.device.on().catch(this.error);
            this.device?.setHumidityMode('sleep').catch(this.error);
            this.setCapabilityValue('onoff', true).catch(this.error);
        }
        this.log(value);
    }

    async updateDevice(): Promise<void> {
        //Getting latest device status
        await this.device.getStatus().catch(this.error);
        if (this.device.isConnected()) {
            if (!this.getAvailable()) {
                await this.setAvailable().catch(this.error);
            }
            this.setCapabilityValue('onoff', this.device.isOn()).catch(this.error);
            if (this.hasCapability("classic300sCapability") && this.device.isOn()) {
                if (this.device.mode === "manual") {
                    this.setCapabilityValue('classic300sCapability',
                        ["low", "medium", "high"][this.device.mist_level - 1 ?? 1] ?? "low").catch(this.error);
                } else if (this.device.mode === "sleep")
                    this.setCapabilityValue('classic300sCapability', "sleep").catch(this.error);
                else if (this.device.mode === "auto")
                    this.setCapabilityValue('classic300sCapability', "auto").catch(this.error);
            }

            if (this.hasCapability("measure_humidity"))
                this.setCapabilityValue("measure_humidity", this.device.humidity).catch(this.error);
            if (this.hasCapability("alarm_water_lacks")) {
                this.setCapabilityValue("alarm_water_lacks", this.device.water_lacks).catch(this.error);
                if (this.device.water_lacks) {
                    await this.homey.flow.getTriggerCard("water_lacks").trigger();
                }
            }
        } else if (this.getAvailable()) {
            await this.setUnavailable(this.homey.__("devices.offline")).catch(this.error);
            await this.setCapabilityValue('onoff', false).catch(this.error);
        }
        this.log("Updating device status!");
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
