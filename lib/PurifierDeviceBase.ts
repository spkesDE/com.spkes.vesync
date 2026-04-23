import Homey from "homey";
import VeSync from "../tsvesync/VeSync";
import VeSyncApp from "../app";
import BasicPurifier from "../tsvesync/lib/BasicPurifier";
import DeviceModes from "../tsvesync/enum/DeviceModes";

export default class PurifierDeviceBase extends Homey.Device {
    device!: BasicPurifier;
    private updateInterval!: NodeJS.Timer;
    private lastKnownFlowMode: string | null = null;
    private lastKnownPm25: number | null = null;
    private lastKnownAirQuality: string | null = null;
    private lastKnownFilterLife: number | null = null;

    async onInit() {
        const deviceReady = await this.getDevice().then(() => true).catch((reason) => {
            this.log(reason);
            return false;
        });

        if (!deviceReady) {
            return;
        }

        await this.updateDevice().catch(this.error);
        if (this.hasCapability("display_toggle"))
            this.registerCapabilityListener("display_toggle", async (value) => {
                await this.device.setDisplay(value).catch(this.error);
                this.log(`Display: ${value}`);
            });
        if (this.hasCapability("nightlight_toggle"))
            this.registerCapabilityListener("nightlight_toggle", async (value) => {
                await this.device.setNightLight(value ? "on" : "off").catch(this.error);
                this.log(`Night Light: ${value}`);
            });
        this.updateInterval = this.homey.setInterval(async () => this.updateDevice().catch(this.error), 1000 * 60);
    }

    async onDeleted() {
        if (this.updateInterval) {
            this.homey.clearInterval(this.updateInterval);
        }
    }

    async setMode(value: string) {
        this.log("Mode: " + value);
        if (value === "on") {
            this.device.setSwitch(true).catch(this.error);
            return;
        }
        if (value === "off") {
            this.device.setSwitch(false).catch(this.error);
            return;
        }
        if (value.startsWith("fan_speed_")) {
            let level = Number(value.replace("fan_speed_", ""));
            this.device.setLevel(level).catch(this.error);
            return;
        }
        if (value === "manual") {
            const level = this.device.status?.level ?? 1;
            this.device.setLevel(level > 0 ? level : 1).catch(this.error);
            return;
        }
        if (value === "auto") {
            await this.device.setPurifierMode(DeviceModes.Auto).catch(this.error)
            return;
        }
        if (value === "sleep") {
            await this.device.setPurifierMode(DeviceModes.Sleep).catch(this.error)
            return;
        }
        if (value === "pet") {
            await this.device.setPurifierMode(DeviceModes.Pet).catch(this.error)
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
            const status = await this.device.getPurifierStatus().catch(async (reason: Error) => {
                if (reason.message === "device offline") {
                    await this.setUnavailable(this.homey.__("devices.offline")).catch(this.error);
                } else {
                    await this.setUnavailable(reason.message).catch(this.error);
                    this.error(reason);
                }
                return null;
            });
            if (!status || status.msg !== "request success") {
                this.error("Failed to get device status.");
                await this.setUnavailable(this.homey.__("devices.offline"))
                return reject("Cannot get device status. Device is " + status?.msg);
            }
            await this.setAvailable().catch(this.error);
            return resolve();
        })
    }

    async updateDevice(): Promise<void> {
        if (!this.device) {
            this.log("Device is undefined", this.device);
            return;
        }

        // Get the latest device status
        const status = await this.device.getPurifierStatus().catch(async (reason: Error) => {
            if (reason.message === "device offline") {
                await this.markDeviceOffline();
            } else {
                await this.setUnavailable(reason.message).catch(this.error);
                this.error(reason);
            }
            return null;
        });

        // If status fetch failed, exit early
        if (!status || status.msg !== "request success") {
            this.error("Failed to get device status.");
            if (this.getAvailable()) {
                await this.markDeviceOffline();
            }
            return;
        }

        // Set the device as available
        if (!this.getAvailable()) {
            await this.setAvailable().catch(this.error);
            await this.homey.flow.getDeviceTriggerCard("device_online").trigger(this).catch(this.error);
        }

        // Helper function to update capability
        const updateCapability = async (capability: string, value: any) => {
            if (this.hasCapability(capability)) {
                await this.setCapabilityValue(capability, value).catch(this.error);
            }
        };

        // Update device status values
        const level = status.result.result.level ?? 0;
        await updateCapability('onoff', status.result.result.enabled ?? false);
        await updateCapability('fanSpeed0to3', level);
        await updateCapability('fanSpeed0to4', level);
        await updateCapability('fanSpeed0to5', level);
        await updateCapability('fanSpeed0to9', level);

        // Air quality and filter life
        const airQualityValue = status.result.result.air_quality_value ?? 0;
        await updateCapability('measure_pm25', airQualityValue);
        await updateCapability('alarm_pm25', airQualityValue > 91);

        const filterLife = status.result.result.filter_life ?? 100;
        await updateCapability('measure_filter_life', filterLife);

        const replaceFilter = Boolean(status.result.result.replace_filter);
        await updateCapability('alarm_filter_life', replaceFilter);
        if (replaceFilter) {
            await this.homey.flow.getDeviceTriggerCard("filter_life_low").trigger(this).catch(this.error);
        }

        // Other status updates
        await updateCapability('display_toggle', Boolean(status.result.result.display));
        await updateCapability('nightlight_toggle', status.result.result.night_light === "on");

        const currentFlowMode = this.getFlowMode();
        if (currentFlowMode !== null) {
            if (this.lastKnownFlowMode !== null && this.lastKnownFlowMode !== currentFlowMode) {
                await this.homey.flow.getDeviceTriggerCard("purifier_mode_changed").trigger(this, {
                    mode: this.formatFlowMode(currentFlowMode),
                    previous_mode: this.formatFlowMode(this.lastKnownFlowMode),
                }).catch(this.error);
            }
            this.lastKnownFlowMode = currentFlowMode;
        }

        const currentAirQuality = typeof status.result.result.air_quality === "string"
            ? status.result.result.air_quality
            : null;
        if (this.lastKnownPm25 !== null && this.lastKnownPm25 !== airQualityValue) {
            await this.homey.flow.getDeviceTriggerCard("air_quality_changed").trigger(this, {
                pm25: airQualityValue,
                previous_pm25: this.lastKnownPm25,
                quality: this.formatAirQuality(currentAirQuality),
                previous_quality: this.formatAirQuality(this.lastKnownAirQuality),
            }).catch(this.error);
            await this.homey.flow.getDeviceTriggerCard("pm25_above_threshold").trigger(this, {
                pm25: airQualityValue,
                previous_pm25: this.lastKnownPm25,
                quality: this.formatAirQuality(currentAirQuality),
                previous_quality: this.formatAirQuality(this.lastKnownAirQuality),
            }, {
                pm25: airQualityValue,
                previous_pm25: this.lastKnownPm25,
            }).catch(this.error);
        }
        this.lastKnownPm25 = airQualityValue;
        this.lastKnownAirQuality = currentAirQuality;

        if (this.lastKnownFilterLife !== null && this.lastKnownFilterLife !== filterLife) {
            await this.homey.flow.getDeviceTriggerCard("filter_life_below_threshold").trigger(this, {
                filter_life: filterLife,
                previous_filter_life: this.lastKnownFilterLife,
            }, {
                filter_life: filterLife,
                previous_filter_life: this.lastKnownFilterLife,
            }).catch(this.error);
        }
        this.lastKnownFilterLife = filterLife;
    }


    async checkForCapability(capability: string) {
        if (!this.hasCapability(capability))
            await this.addCapability(capability).catch(this.error);
    }

    private async markDeviceOffline(): Promise<void> {
        const wasAvailable = this.getAvailable();
        await this.setUnavailable(this.homey.__("devices.offline")).catch(this.error);
        if (wasAvailable) {
            await this.homey.flow.getDeviceTriggerCard("device_offline").trigger(this).catch(this.error);
        }
    }

    private getFlowMode(): string | null {
        if (!this.device?.status) {
            return null;
        }
        if (!this.device.status.enabled) {
            return "off";
        }

        return typeof this.device.status.mode === "string" ? this.device.status.mode : null;
    }

    private formatFlowMode(mode: string): string {
        switch (mode) {
            case "off":
                return "Off";
            case "auto":
                return "Auto";
            case "manual":
                return "Manual";
            case "sleep":
                return "Sleep";
            case "pet":
                return "Pet";
            case "turbo":
                return "Turbo";
            default:
                return mode;
        }
    }

    private formatAirQuality(quality: string | null): string {
        switch (quality) {
            case "excellent":
                return "Excellent";
            case "good":
                return "Good";
            case "moderate":
                return "Moderate";
            case "poor":
                return "Poor";
            case "very poor":
                return "Very poor";
            default:
                return quality ?? "";
        }
    }

}
