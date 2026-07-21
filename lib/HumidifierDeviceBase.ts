import VeSync from "../tsvesync/VeSync";
import VeSyncApp from "../app";
import BasicHumidifier from "../tsvesync/lib/BasicHumidifier";
import DeviceModes from "../tsvesync/enum/DeviceModes";
import { getErrorMessage } from "./utils/error";
import HomeyDeviceBase from "./HomeyDeviceBase";

export default class HumidifierDeviceBase extends HomeyDeviceBase {
    device!: BasicHumidifier;
    private lastKnownFlowMode: string | null = null;
    private lastKnownWaterLacks: boolean | null = null;
    private lastKnownHumidity: number | null = null;

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
                await this.device.setNightLightBrightness(value ? 50 : 0).catch(this.error);
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
            ], async () => {
                if (this.device.status?.mode !== DeviceModes.Manual) {
                    this.assertCommandSucceeded(await this.device.setHumidityMode(DeviceModes.Manual));
                }
                return this.device.setLevel(level);
            });
            return;
        }
        if (value === "auto") {
            await this.runCommandWithOptimisticCapability('onoff', true, async () => {
                if (!this.device.status?.enabled) {
                    this.assertCommandSucceeded(await this.device.setSwitch(true));
                }
                return this.device.setHumidityMode(DeviceModes.Auto);
            });
            return;
        }
        if (value === "manual") {
            const fanSpeed = this.device.status?.mist_level ?? 1;
            await this.runCommandWithOptimisticCapabilities([
                {capability: 'onoff', value: true},
                ...this.getOptimisticFanSpeedUpdates(fanSpeed),
            ], async () => {
                if (this.device.status?.mode !== DeviceModes.Manual) {
                    this.assertCommandSucceeded(await this.device.setHumidityMode(DeviceModes.Manual));
                }
                return this.device.setLevel(fanSpeed);
            });
            return;
        }
        if (value === "sleep") {
            await this.runCommandWithOptimisticCapability('onoff', true, async () => {
                if (!this.device?.status?.enabled) {
                    this.assertCommandSucceeded(await this.device.setSwitch(true));
                }
                return this.device.setHumidityMode(DeviceModes.Sleep);
            });
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

        if (!(device instanceof BasicHumidifier)) {
            this.error("Device is undefined or is not a VeSyncHumidifier");
            await this.setUnavailable(this.homey.__("devices.not_found"));
            throw new Error("Device is undefined or is not a VeSyncHumidifier");
        }

        this.device = device;
        const status = await this.device.getHumidifierStatus().catch(async (reason: unknown) => {
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
        const status = await this.device.getHumidifierStatus().catch(async (reason: unknown) => {
            const message = getErrorMessage(reason);
            await this.handleDeviceStatusFailure(message, true);
            return null;
        });

        // If the status fetch failed, exit early
        if (!status) {
            return;
        }

        if (status.msg !== "request success") {
            await this.handleDeviceStatusFailure(status.msg, true);
            return;
        }

        // Set the device as available
        await this.markDeviceOnline();

        // Update capabilities based on status
        // Fan speed updates
        const fanSpeed = status.result.result.virtual_mist_level ?? status.result.result.mist_level ?? 0;
        await this.setCapabilityIfPresent('fanSpeed0to2', fanSpeed);
        await this.setCapabilityIfPresent('fanSpeed0to3', fanSpeed);
        await this.setCapabilityIfPresent('fanSpeed0to4', fanSpeed);
        await this.setCapabilityIfPresent('fanSpeed0to5', fanSpeed);
        await this.setCapabilityIfPresent('fanSpeed0to9', fanSpeed);

        // Humidity updates
        await this.setCapabilityIfPresent('measure_humidity', status.result.result.humidity ?? 0);

        // Water lacks alarm
        const waterLacks = status.result.result.water_lacks ?? false;
        await this.setCapabilityIfPresent('alarm_water_lacks', waterLacks);
        if (waterLacks) {
            await this.homey.flow.getDeviceTriggerCard("water_lacks").trigger(this).catch(this.error);
        }
        if (this.lastKnownWaterLacks === true && waterLacks === false) {
            await this.homey.flow.getDeviceTriggerCard("water_tank_refilled").trigger(this).catch(this.error);
        }
        this.lastKnownWaterLacks = waterLacks;


        // Nightlight state
        await this.setCapabilityIfPresent('nightlight_toggle', status.result.result.night_light_brightness > 0);

        // Update target humidity setting
        const currentSettingHumidity = this.getSetting("humidity");
        const currentHumidity = status.result.result.humidity ?? 0;
        const statusResult = status.result.result as any;
        const deviceHumidity =
            statusResult.configuration?.auto_target_humidity ??
            statusResult.targetHumidity ??
            statusResult.target_humidity ??
            0;
        if (currentSettingHumidity != null && Number(currentSettingHumidity) !== deviceHumidity) {
            await this.setSettings({humidity: deviceHumidity}).catch(this.error);
        }
        if (deviceHumidity > 0 && this.lastKnownHumidity !== null && this.lastKnownHumidity < deviceHumidity && currentHumidity >= deviceHumidity) {
            await this.homey.flow.getDeviceTriggerCard("target_humidity_reached").trigger(this, {
                humidity: currentHumidity,
                target_humidity: deviceHumidity,
            }).catch(this.error);
        }
        this.lastKnownHumidity = currentHumidity;

        const currentFlowMode = this.getFlowMode();
        if (currentFlowMode !== null) {
            if (this.lastKnownFlowMode !== null && this.lastKnownFlowMode !== currentFlowMode) {
                await this.homey.flow.getDeviceTriggerCard("humidifier_mode_changed").trigger(this, {
                    mode: this.formatFlowMode(currentFlowMode),
                    previous_mode: this.formatFlowMode(this.lastKnownFlowMode),
                }).catch(this.error);
            }
            this.lastKnownFlowMode = currentFlowMode;
        }
    }

    async onSettings(settings: { oldSettings: any, newSettings: any, changedKeys: string[] }): Promise<string | void> {
        if (settings.changedKeys.includes("humidity"))
            await this.device.setTargetHumidity(settings.newSettings.humidity ?? 45).catch(this.error);
    }

    private getFlowMode(): string | null {
        if (!this.device?.status) {
            return null;
        }
        if (!this.device.status.enabled) {
            return "off";
        }

        switch (this.device.status.mode) {
            case DeviceModes.Auto:
            case DeviceModes.Manual:
            case DeviceModes.Sleep:
                return this.device.status.mode;
            case DeviceModes.Humidity:
                return "auto";
            default:
                return typeof this.device.status.mode === "string" ? this.device.status.mode : null;
        }
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
            default:
                return mode;
        }
    }
}
