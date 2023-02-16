import Homey from "homey";
import VeSync from "../tsvesync/veSync";
import VeSyncApp from "../app";
import VeSyncHumidifier from "../tsvesync/veSyncHumidifier";

export default class HumidifierDeviceBase extends Homey.Device {
    device!: VeSyncHumidifier;
    private updateInterval!: NodeJS.Timer;

    async onInit() {
        await this.getDevice().catch(this.log);
        await this.updateDevice();
        this.updateInterval = setInterval(async () => this.updateDevice(), 1000 * 60);
    }

    async setMode(value: string) {
        this.log("Mode: " + value);
        if (value === "on" || value === "manual") {
            this.device?.toggleSwitch(true).catch(this.error);
            return;
        }
        if (value === "off") {
            this.device?.toggleSwitch(false).catch(this.error);
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
            if (this.device?.isOn())
                this.device?.on().catch(this.error);
            this.device?.setHumidityMode('sleep').catch(this.error);
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
            if (device === undefined || !(device instanceof VeSyncHumidifier)) {
                this.error("Device is undefined or is not a VeSyncHumidifier");
                await this.setUnavailable(this.homey.__("devices.not_found"));
                return reject("Device is undefined or is not a VeSyncHumidifier");
            }
            this.device = device as VeSyncHumidifier;
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
            if (this.hasCapability("measure_humidity"))
                this.setCapabilityValue("measure_humidity", this.device.humidity).catch(this.error);
            if (this.hasCapability("alarm_water_lacks")) {
                this.setCapabilityValue("alarm_water_lacks", this.device.water_lacks).catch(this.error);
                if (this.device.water_lacks) await this.homey.flow.getTriggerCard("water_lacks").trigger();
            }
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
    }

    async checkForCapability(capability: string) {
        if (!this.hasCapability(capability))
            await this.addCapability(capability);
    }
}
