import Homey from "homey";
import VeSync from "../tsvesync/VeSync";
import VeSyncApp from "../app";
import BasicHumidifier from "../tsvesync/lib/BasicHumidifier";
import DeviceModes from "../tsvesync/enum/DeviceModes";

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
            this.device?.setSwitch(true).catch(this.error);
            return;
        }
        if (value === "off") {
            this.device?.setSwitch(false).catch(this.error);
            return;
        }
        if (value.startsWith("fan_speed_")) {
            let level = Number(value.replace("fan_speed_", ""));
            if (this.device.status?.mode !== DeviceModes.Manual)
                await this.device.setHumidityMode(DeviceModes.Manual).catch(this.error);
            this.device?.setLevel(level).catch(this.error);
            return;
        }
        if (value === "auto") {
            if (!this.device.status?.enabled)
                await this.device?.setSwitch(true).catch(this.error);
            this.device?.setHumidityMode(DeviceModes.Auto).catch(this.error);
            return;
        }
        if (value === "manual") {
            if (this.device.status?.mode !== DeviceModes.Manual)
                await this.device.setHumidityMode(DeviceModes.Manual).catch(this.error);
            this.device?.setLevel(this.device.status?.mist_level ?? 1).catch(this.error);
            return;
        }
        if (value === "sleep") {
            if (!this.device?.status?.enabled)
                await this.device?.setSwitch(true).catch(this.error);
            this.device?.setHumidityMode(DeviceModes.Sleep).catch(this.error);
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
            const status = await this.device.getHumidifierStatus();
            if (status.msg === "request success") {
                await this.setAvailable().catch(this.error);
                return resolve();
            }
            await this.setUnavailable(this.homey.__("devices.offline"))
            return reject("Cannot get device status. Device is " + this.device.device.connectionStatus);
        })
    }

    async updateDevice(): Promise<void> {
        if (!this.device) {
            this.log("Device is undefined", this.device);
            return;
        }

        // Get the latest device status
        const status = await this.device.getHumidifierStatus().catch(async (reason: Error) => {
            if (reason.message === "device offline") {
                await this.setUnavailable(this.homey.__("devices.offline")).catch(this.error);
            } else {
                await this.setUnavailable(reason.message).catch(this.error);
                this.error(reason);
            }
            return null;
        });

        // If the status fetch failed, exit early
        if (!status || status.msg !== "request success") {
            if (this.getAvailable()) {
                await this.setUnavailable(this.homey.__("devices.offline")).catch(this.error);
            }
            return;
        }

        // Set the device as available
        if (!this.getAvailable()) {
            await this.setAvailable().catch(this.error);
        }

        // Update capabilities based on status
        const updateCapability = async (capability: string, value: any) => {
            if (this.hasCapability(capability)) {
                await this.setCapabilityValue(capability, value).catch(this.error);
            }
        };

        // Fan speed updates
        const fanSpeed = status.result.result.virtual_mist_level ?? status.result.result.mist_level ?? 0;
        await updateCapability('fanSpeed0to3', fanSpeed);
        await updateCapability('fanSpeed0to4', fanSpeed);
        await updateCapability('fanSpeed0to5', fanSpeed);
        await updateCapability('fanSpeed0to9', fanSpeed);

        // Humidity updates
        await updateCapability('measure_humidity', status.result.result.humidity ?? 0);

        // Water lacks alarm
        const waterLacks = status.result.result.water_lacks ?? false;
        await updateCapability('alarm_water_lacks', waterLacks);
        if (waterLacks) {
            await this.homey.flow.getDeviceTriggerCard("water_lacks").trigger(this).catch(this.error);
        }


        // Nightlight state
        await updateCapability('nightlight_toggle', status.result.result.night_light_brightness > 0 ?? false);

        // Update target humidity setting
        const currentSettingHumidity = this.getSetting("humidity");
        const deviceHumidity = status.result.result.configuration.auto_target_humidity ?? 0;
        if (currentSettingHumidity != null && Number(currentSettingHumidity) !== deviceHumidity) {
            await this.setSettings({humidity: deviceHumidity}).catch(this.error);
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
