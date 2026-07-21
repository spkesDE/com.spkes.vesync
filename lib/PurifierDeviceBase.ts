import VeSync from "../tsvesync/VeSync";
import VeSyncApp from "../app";
import BasicPurifier from "../tsvesync/lib/BasicPurifier";
import DeviceModes from "../tsvesync/enum/DeviceModes";
import {getErrorMessage} from "./utils/error";
import HomeyDeviceBase from "./HomeyDeviceBase";

export default class PurifierDeviceBase extends HomeyDeviceBase {
    device!: BasicPurifier;
    private lastKnownFlowMode: string | null = null;
    private lastKnownPm25: number | null = null;
    private lastKnownAirQuality: string | null = null;
    private lastKnownFilterLife: number | null = null;
    private lastKnownChildLock: boolean | null = null;

    async onInit() {
        this.registerCapabilityListeners();
        await this.startDevicePolling(
            () => this.getDevice(false),
            () => this.updateDevice(),
        );
    }

    private registerCapabilityListeners(): void {
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
    }

    async setMode(value: string) {
        this.log("Mode: " + value);
        if (value === "on") {
            await this.runCommandWithOptimisticCapability('onoff', true, () => this.device.setSwitch(true));
            return;
        }
        if (value === "off") {
            await this.runCommandWithOptimisticCapability('onoff', false, () => this.device.setSwitch(false));
            return;
        }
        if (value.startsWith("fan_speed_")) {
            let level = Number(value.replace("fan_speed_", ""));
            await this.runCommandWithOptimisticCapabilities([
                {capability: 'onoff', value: level > 0},
                ...this.getOptimisticFanSpeedUpdates(level),
            ], () => this.device.setLevel(level));
            return;
        }
        if (value === "manual") {
            const level = this.device.status?.level ?? 1;
            const fanSpeed = level > 0 ? level : 1;
            await this.runCommandWithOptimisticCapabilities([
                {capability: 'onoff', value: true},
                ...this.getOptimisticFanSpeedUpdates(fanSpeed),
            ], () => this.device.setLevel(fanSpeed));
            return;
        }
        if (value === "auto") {
            await this.runCommandWithOptimisticCapability('onoff', true, () => this.device.setPurifierMode(DeviceModes.Auto));
            return;
        }
        if (value === "sleep") {
            await this.runCommandWithOptimisticCapability('onoff', true, () => this.device.setPurifierMode(DeviceModes.Sleep));
            return;
        }
        if (value === "pet") {
            await this.runCommandWithOptimisticCapability('onoff', true, () => this.device.setPurifierMode(DeviceModes.Pet));
            return;
        }
        this.error("Unknown Mode: " + value);
    }

    public async getDevice(setAvailableOnSuccess = true): Promise<void> {
        const veSync: VeSync = (this.homey.app as VeSyncApp).veSync;
        if (veSync === null || !veSync.isLoggedIn()) {
            await this.setUnavailable(this.homey.__("devices.failed_login"));
            throw new Error("Failed to login. Please use the repair function.");
        }

        const device = this.findStoredVeSyncDevice(veSync.getStoredDevice());

        if (!(device instanceof BasicPurifier)) {
            this.error("Device is undefined or is not a VeSyncPurifier");
            await this.setUnavailable(this.homey.__("devices.not_found"));
            throw new Error("Device is undefined or is not a VeSyncPurifier");
        }

        this.device = device;
        const status = await this.device.getPurifierStatus().catch(async (reason: unknown) => {
            const message = getErrorMessage(reason);
            await this.handleDeviceStatusFailure(message);
            return null;
        });

        if (!status) {
            throw this.handledDeviceStatusError("Cannot get device status. Device status request failed");
        }

        if (status.msg !== "request success") {
            await this.handleDeviceStatusFailure(status.msg);
            throw this.handledDeviceStatusError("Cannot get device status. Device is " + status.msg);
        }

        if (setAvailableOnSuccess) {
            await this.setAvailable();
        }
    }

    async updateDevice(): Promise<void> {
        if (!this.device) {
            this.log("Device is undefined", this.device);
            return;
        }

        // Get the latest device status
        const status = await this.device.getPurifierStatus().catch(async (reason: unknown) => {
            const message = getErrorMessage(reason);
            await this.handleDeviceStatusFailure(message, true);
            return null;
        });

        // If status fetch failed, exit early
        if (!status) {
            return;
        }

        if (status.msg !== "request success") {
            await this.handleDeviceStatusFailure(status.msg, true);
            return;
        }

        // Set the device as available
        await this.markDeviceOnline();

        // Helper function to update capability
        // Update device status values
        const level = status.result.result.level ?? 0;
        await this.setCapabilityIfPresent('onoff', status.result.result.enabled ?? false);
        await this.setCapabilityIfPresent('fanSpeed0to3', level);
        await this.setCapabilityIfPresent('fanSpeed0to4', level);
        await this.setCapabilityIfPresent('fanSpeed0to5', level);
        await this.setCapabilityIfPresent('fanSpeed0to9', level);

        // Air quality and filter life
        const airQualityValue = status.result.result.air_quality_value ?? 0;
        await this.setCapabilityIfPresent('measure_pm25', airQualityValue);
        await this.setCapabilityIfPresent('alarm_pm25', airQualityValue > 91);

        const filterLife = status.result.result.filter_life ?? 100;
        await this.setCapabilityIfPresent('measure_filter_life', filterLife);

        const replaceFilter = Boolean(status.result.result.replace_filter);
        await this.setCapabilityIfPresent('alarm_filter_life', replaceFilter);
        if (replaceFilter) {
            await this.homey.flow.getDeviceTriggerCard("filter_life_low").trigger(this).catch(this.error);
        }

        // Other status updates
        await this.setCapabilityIfPresent('display_toggle', Boolean(status.result.result.display));
        await this.setCapabilityIfPresent('nightlight_toggle', status.result.result.night_light === "on");

        const childLock = Boolean(status.result.result.child_lock);
        if (this.lastKnownChildLock !== null && this.lastKnownChildLock !== childLock) {
            await this.homey.flow.getDeviceTriggerCard("child_lock_changed").trigger(this, {
                child_lock: childLock,
            }).catch(this.error);
        }
        this.lastKnownChildLock = childLock;

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
