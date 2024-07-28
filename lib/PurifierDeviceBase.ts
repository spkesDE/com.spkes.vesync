import Homey from "homey";
import VeSync from "../tsvesync/veSync";
import VeSyncApp from "../app";
import BasicPurifier from "../tsvesync/lib/BasicPurifier";
import DeviceModes from "../tsvesync/enum/DeviceModes";

export default class PurifierDeviceBase extends Homey.Device {
    device!: BasicPurifier;
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
                await this.device.setNightLight({
                    night_light: value ? "on" : "off"
                }).catch(this.error);
                this.log(`Night Light: ${value}`);
            });
        this.updateInterval = this.homey.setInterval(async () => this.updateDevice().catch(this.error), 1000 * 60);
    }

    async setMode(value: string) {
        this.log("Mode: " + value);
        if (value === "on") {
            this.device.setSwitch({
                enabled: 1,
                id: 0
            }).catch(this.error);
            return;
        }
        if (value === "off") {
            this.device.setSwitch({
                enabled: 0,
                id: 0
            }).catch(this.error);
            return;
        }
        if (value.startsWith("fan_speed_")) {
            let level = Number(value.replace("fan_speed_", ""));
            this.device.setLevel({
                level: level,
                id: 0,
                type: 'wind'
            }).catch(this.error);
            return;
        }
        if (value === "manual") {
            if (this.device.status?.mode !== "manual")
                this.device.setPurifierMode({
                    mode: DeviceModes.Normal
                }).catch(this.error);
            this.device.setLevel({
                level: this.device.status?.level ?? 1,
                id: 0,
                type: 'wind'
            }).catch(this.error);
            return;
        }
        if (value === "auto") {
            this.device.setPurifierMode({
                mode: DeviceModes.Auto
            }).catch(this.error);
            return;
        }
        if (value === "sleep") {
            this.device.setPurifierMode({
                mode: DeviceModes.Sleep
            }).catch(this.error);
            return;
        }
        if (value === "pet") {
            this.device.setPurifierMode({
                mode: DeviceModes.Pet
            }).catch(this.error);
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
            if (device === undefined || !(device instanceof BasicPurifier)) {
                this.error("Device is undefined or is not a VeSyncPurifier");
                await this.setUnavailable(this.homey.__("devices.not_found"));
                return reject("Device is undefined or is not a VeSyncPurifier");
            }
            this.device = device as BasicPurifier;
            const status = await this.device.getPurifierStatus();
            if (status.msg === "request success") {
                await this.setAvailable().catch(this.error);
                return resolve();
            }
            await this.setUnavailable(this.homey.__("devices.offline"))
            return reject("Cannot get device status. Device is " + status.msg);
        })
    }

    async updateDevice(): Promise<void> {
        //Getting latest device status
        const status = await this.device.getPurifierStatus();
        if (status.msg !== "request success") {
            this.error("Failed to get device status. " + status.msg);
            await this.setUnavailable(this.homey.__("devices.offline"));
            return;
        }
        if (!this.getAvailable())
            await this.setAvailable().catch(this.error);
        if (this.hasCapability("fanSpeed0to3"))
            this.setCapabilityValue('fanSpeed0to3', status.result.result.level ?? 0).catch(this.error);
        if (this.hasCapability("fanSpeed0to4"))
            this.setCapabilityValue('fanSpeed0to4', status.result.result.level ?? 0).catch(this.error);
        if (this.hasCapability("fanSpeed0to5"))
            this.setCapabilityValue('fanSpeed0to5', status.result.result.level?? 0).catch(this.error);
        if (this.hasCapability("fanSpeed0to9"))
            this.setCapabilityValue('fanSpeed0to9', status.result.result.level ?? 0).catch(this.error);
        if (this.hasCapability("measure_pm25"))
            await this.setCapabilityValue('measure_pm25', status.result.result.air_quality_value ?? 0)
        if (this.hasCapability("alarm_pm25"))
            await this.setCapabilityValue('alarm_pm25', status.result.result.air_quality_value> 91 ?? false)
        if (this.hasCapability("measure_filter_life"))
            this.setCapabilityValue("measure_filter_life", status.result.result.filter_life?? 100).catch(this.error);
        if (this.hasCapability("alarm_filter_life")) {
            this.setCapabilityValue("alarm_filter_life", Boolean(status.result.result.replace_filter)).catch(this.error);
            if (Boolean(status.result.result.replace_filter)) await this.homey.flow.getDeviceTriggerCard("filter_life_low").trigger(this);
        }
        if (this.hasCapability("display_toggle"))
            this.setCapabilityValue("display_toggle", Boolean(status.result.result.display)).catch(this.error);
        if (this.hasCapability("nightlight_toggle"))
            this.setCapabilityValue("nightlight_toggle", Boolean(status.result.result.night_light)).catch(this.error);
    }

    async checkForCapability(capability: string) {
        if (!this.hasCapability(capability))
            await this.addCapability(capability).catch(this.error);
    }

}
