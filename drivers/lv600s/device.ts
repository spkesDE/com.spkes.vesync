import Homey from 'homey';
import VeSyncDeviceInterface from "../../lib/VeSyncDeviceInterface";
import VeSyncHumidifier from "../../tsvesync/veSyncHumidifier";
import VeSync from "../../tsvesync/veSync";
import VeSyncApp from "../../app";

class LV600S extends Homey.Device implements VeSyncDeviceInterface {
    device!: VeSyncHumidifier;
    updateInterval!: NodeJS.Timer;

    /**
     * onInit is called when the device is initialized.
     */
    async onInit() {
        await this.getDevice().catch(this.log);
        this.registerCapabilityListener("onoff", async (value) => await this.setMode(value ? "on" : "off"));
        this.registerCapabilityListener("lv600sCapability", async (value) => await this.setMode(value));
        this.registerCapabilityListener("lv600sWarmCapability", async (value) => await this.setMode(value));
        this.registerFlows();

        await this.updateDevice();
        this.updateInterval = setInterval(async () => this.updateDevice(), 1000 * 60);

        this.log('LV600S has been initialized');
    }

    /**
     * onAdded is called when the user adds the device, called just after pairing.
     */
    async onAdded() {
        this.log('LV600S has been added');
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
        this.log('MyDevice settings where changed');
    }

    /**
     * onRenamed is called when the user updates the device's name.
     * This method can be used this to synchronise the name to the device.
     * @param {string} name The new name
     */
    async onRenamed(name: string) {
        this.log('MyDevice was renamed');
    }

    /**
     * onDeleted is called when the user deleted the device.
     */
    async onDeleted() {
        this.log('MyDevice has been deleted');
    }

    async setMode(value: string) {
        if (!this.device.isConnected()) {
            this.error("LV600S is not connected");
            return;
        }
        this.log("Mode: " + value);
        if (value === "on" || value === "manual") {
            this.device?.toggleSwitch(true).catch(this.error);
            this.setCapabilityValue('onoff', true).catch(this.error);
            this.setCapabilityValue('lv600sCapability', "fan_speed_" + this.device.extension.fanSpeedLevel ?? "1").catch(this.error);
            return;
        }
        if (value === "off") {
            this.device?.toggleSwitch(false).catch(this.error);
            this.setCapabilityValue('onoff', false).catch(this.error);
            this.setCapabilityValue('lv600sCapability', "off").catch(this.error);
            return;
        }
        if (value.startsWith("fan_speed_")) {
            let level = Number(value.replace("fan_speed_", ""));
            if (this.device.mode == "sleep")
                await this.device.setHumidityMode("humidity");
            this.device?.setMistLevel(level).catch(this.error);
            return;
        }
        if (value.startsWith("warm_fan_speed_")) {
            let level = Number(value.replace("warm_fan_speed_", ""));
            this.device?.setWarmLevel(level).catch(this.error);
            return;
        }
        if (value === "sleep") {
            if (this.device?.deviceStatus === 'off')
                this.device?.on().catch(this.error);
            this.device?.setHumidityMode('sleep').catch(this.error);
            this.setCapabilityValue('onoff', true).catch(this.error);
            return;
        }
    }

    getDevice(): Promise<void> {
        return new Promise(async (resolve, reject) => {
            let veSync: VeSync = (this.homey.app as VeSyncApp).veSync;
            if (veSync === null || !veSync.isLoggedIn()) {
                await this.setUnavailable(this.homey.__("devices.failed_login"));
                return reject("Failed to login. Please use the repair function.");
            }
            let device = veSync.getStoredDevice().find(d => d.uuid === this.getData().id);
            if (device === undefined || !(device instanceof VeSyncHumidifier)) {
                this.error("Device is undefined or is not a LV600S");
                await this.setUnavailable(this.homey.__("devices.not_found"));
                return reject("Device is undefined or is not a LV600S");
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

    public registerFlows(): void {
        this.homey.flow.getActionCard("setModeLV600S").registerRunListener(async (args) => await this.setMode(args.mode));
    }

    async updateDevice(): Promise<void> {
        //Getting latest device status
        await this.device.getStatus().catch(this.error);
        if (this.device.isConnected()) {
            if (!this.getAvailable()) {
                await this.setAvailable().catch(this.error);
            }
            this.setCapabilityValue('onoff', this.device.deviceStatus === "on").catch(this.error);
            if (this.hasCapability("lv600sCapability") && this.device.deviceStatus === "on") {
                if (this.device.mode === "manual") {
                    this.setCapabilityValue('lv600sCapability', "fan_speed_" + this.device.mist_level).catch(this.error);
                } else if (this.device.mode === "sleep")
                    this.setCapabilityValue('lv600sCapability', "sleep").catch(this.error);
                else if (this.device.mode === "auto")
                    this.setCapabilityValue('lv600sCapability', "auto").catch(this.error);
            }

            if (this.device.water_lacks) {
                await this.setUnavailable(this.homey.__("devices.water_lacks")).catch(this.error);
            } else {
                await this.setUnavailable().catch(this.error);
            }

            if (this.hasCapability("lv600sWarmCapability") && this.device.deviceStatus === "on") {
                this.setCapabilityValue('lv600sWarmCapability', "warm_fan_speed_" + this.device.warm_mist_level).catch(this.error);
            }

            if (this.hasCapability("measure_humidity"))
                this.setCapabilityValue("measure_humidity", this.device.humidity).catch(this.error);
        } else if (this.getAvailable()) {
            await this.setUnavailable(this.homey.__("devices.offline")).catch(this.error);
            await this.setCapabilityValue('onoff', false).catch(this.error);
        }

        this.log("Updating device status!");
    }


}

module.exports = LV600S;
