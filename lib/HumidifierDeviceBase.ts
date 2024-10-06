import Homey from "homey";
import VeSync from "../tsvesync/VeSync";
import VeSyncApp from "../app";
import BasicHumidifier from "../tsvesync/lib/BasicHumidifier";

export default class HumidifierDeviceBase extends Homey.Device {
    device!: BasicHumidifier;
    private updateInterval!: NodeJS.Timer;

    async onInit() {
        await this.getDevice().catch(this.log);
        await this.updateDevice().catch(this.error);
        if (this.hasCapability("display_toggle"))
            this.registerCapabilityListener("display_toggle", async (value) => {
                await this.device.setDisplay(value).catch(this.error);
                this.log(`Display: ${value}`);
            });
        if (this.hasCapability("nightlight_toggle"))
            this.registerCapabilityListener("nightlight_toggle", async (value) => {
                await this.device.setNightLightBrightness(value ? 50 : 0).catch(this.error);
                this.log(`Night Light: ${value}`);
            });
        this.updateInterval = this.homey.setInterval(async () => this.updateDevice().catch(this.error), 1000 * 60);
    }

    async setMode(value: string) {
        this.log("Mode: " + value);
        if (value === "on") {
            this.device?.toggleSwitch(true).catch(this.error);
            return;
        }
        if (value === "off") {
            this.device?.toggleSwitch(false).catch(this.error);
            return;
        }
        if (value.startsWith("fan_speed_")) {
            let level = Number(value.replace("fan_speed_", ""));
            if (this.device.status.mode !== "manual")
                await this.device.setHumidityMode("manual").catch(this.error);
            this.device?.setMistLevel(level).catch(this.error);
            return;
        }
        if (value.startsWith("warm_fan_speed_")) {
            let level = Number(value.replace("warm_fan_speed_", ""));
            this.device?.setWarmLevel(level).catch(this.error);
            return;
        }
        if (value === "auto") {
            if (!this.device.status.enabled)
                await this.device?.on().catch(this.error);
            this.device?.setHumidityMode('auto').catch(this.error);
            return;
        }
        if (value === "manual") {
            if (this.device.status.mode !== "manual")
                await this.device.setHumidityMode("manual").catch(this.error);
            this.device?.setMistLevel(this.device.mist_level ?? 1).catch(this.error);
            return;
        }
        if (value === "sleep") {
            if (this.device?.isOn())
                await this.device?.on().catch(this.error);
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
            let device = veSync.getStoredDevice().find(d => d.device.uuid === this.getData().id);
            if (device === undefined || !(device instanceof BasicHumidifier)) {
                this.error("Device is undefined or is not a VeSyncHumidifier");
                await this.setUnavailable(this.homey.__("devices.not_found"));
                return reject("Device is undefined or is not a VeSyncHumidifier");
            }
            this.device = device as BasicHumidifier;
            if (this.device.status) {
                await this.setAvailable().catch(this.error);
                return resolve();
            }
            await this.setUnavailable(this.homey.__("devices.offline"))
            return reject("Cannot get device status. Device is " + this.device.connectionStatus);
        })
    }

    async updateDevice(): Promise<void> {
        if(this.device === undefined) {
            this.log("Device is undefined");
            this.log(this);
            return;
        }
        //Getting latest device status
        await this.device.getStatus().catch(async (reason: Error) => {
            switch (reason.message) {
                case "device offline":
                    await this.setUnavailable(this.homey.__("devices.offline")).catch(this.error);
                    return;
                default:
                    await this.setUnavailable(reason.message).catch(this.error);
                    this.error(reason);
                    return;
            }
        });
        if (this.device.status) {
            if (!this.getAvailable())
                await this.setAvailable().catch(this.error);
            if (this.hasCapability("fanSpeed0to3"))
                this.setCapabilityValue('fanSpeed0to3', this.device.mist_virtual_level ?? this.device.mist_level ?? 0).catch(this.error);
            if (this.hasCapability("fanSpeed0to4"))
                this.setCapabilityValue('fanSpeed0to4', this.device.mist_virtual_level ?? this.device.mist_level ?? 0).catch(this.error);
            if (this.hasCapability("fanSpeed0to5"))
                this.setCapabilityValue('fanSpeed0to5', this.device.mist_virtual_level ?? this.device.mist_level ?? 0).catch(this.error);
            if (this.hasCapability("fanSpeed0to9"))
                this.setCapabilityValue('fanSpeed0to9', this.device.mist_virtual_level ?? this.device.mist_level ?? 0).catch(this.error);

            if (this.hasCapability("measure_humidity"))
                this.setCapabilityValue("measure_humidity", this.device.humidity ?? 0).catch(this.error);
            if (this.hasCapability("alarm_water_lacks")) {
                this.setCapabilityValue("alarm_water_lacks", this.device.water_lacks ?? false).catch(this.error);
                if (this.device.water_lacks) await this.homey.flow.getDeviceTriggerCard("water_lacks").trigger(this).catch(this.error);
            }
            if (this.hasCapability("measure_filter_life"))
                this.setCapabilityValue("measure_filter_life", this.device.filter_life ?? 100).catch(this.error);
            if (this.hasCapability("alarm_filter_life")) {
                this.setCapabilityValue("alarm_filter_life", this.device.filter_life < 5 ?? false).catch(this.error);
                if (this.device.filter_life < 5) await this.homey.flow.getDeviceTriggerCard("filter_life_low").trigger(this).catch(this.error);
            }
            if (this.hasCapability("display_toggle"))
                this.setCapabilityValue("display_toggle", this.device.display).catch(this.error);
            if (this.hasCapability("nightlight_toggle"))
                this.setCapabilityValue("nightlight_toggle", this.device.night_light_brightness > 0 ?? false).catch(this.error);
            if (this.getSetting("humidity") != null) {
                let humidity = Number(this.getSetting("humidity"));
                if (humidity != this.device.targetHumidity)
                    await this.setSettings({
                        humidity: this.device.targetHumidity ?? 0
                    }).catch(this.error);
            }
        } else if (this.getAvailable()) {
            await this.setUnavailable(this.homey.__("devices.offline")).catch(this.error);
        }
    }

    async onSettings(settings: { oldSettings: any, newSettings: any, changedKeys: string[] }): Promise<string | void> {
        if (settings.changedKeys.includes("humidity"))
            await this.device.setTargetHumidity(settings.newSettings.humidity ?? 45).catch(this.error);
    }

    async checkForCapability(capability: string) {
        if (!this.hasCapability(capability))
            await this.addCapability(capability).catch(this.error);
    }
}
