import VeSync from "../tsvesync/VeSync";
import VeSyncApp from "../app";
import BasicTowerFan from "../tsvesync/lib/BasicTowerFan";
import DeviceModes from "../tsvesync/enum/DeviceModes";
import { getErrorMessage } from "./utils/error";
import HomeyDeviceBase from "./HomeyDeviceBase";


export default class TowerFanDeviceBase extends HomeyDeviceBase {
    device!: BasicTowerFan;

    async onInit() {
        this.registerCapabilityListeners();
        await this.startDevicePolling(
            () => this.getDevice(false),
            () => this.updateDevice(),
        );
    }

    private registerCapabilityListeners(): void {
        if (this.hasCapability("onoff")) this.registerCapabilityListener("onoff", async (value) => {
            await this.setMode(value ? "on" : "off");
        });

        if (this.hasCapability("oscillation_toggle")) this.registerCapabilityListener("oscillation_toggle", async (value) => {
            await this.device.setOscillationSwitch(value).catch(this.error);
        });

        if (this.hasCapability("display_toggle")) this.registerCapabilityListener("display_toggle", async (value) => {
            await this.device.setDisplay(value).catch(this.error);
        });

        if (this.hasCapability("mute_toggle")) this.registerCapabilityListener("mute_toggle", async (value) => {
            await this.device.setMuteSwitch(value).catch(this.error);
        });
    }

    async setMode(value: string) {
        if (value.startsWith("fan_speed_")) {
            let level = Number(value.replace("fan_speed_", ""));
            if (level > 0) {
                await this.runCommandWithOptimisticCapabilities([
                    {capability: 'onoff', value: true},
                    ...this.getOptimisticFanSpeedUpdates(level),
                ], () => this.device.setLevel(level));
            } else await this.setMode("off");
            void this.updateDevice();
            return;
        }
        switch (value) {
            case "on":
                await this.runCommandWithOptimisticCapability('onoff', true, () => this.device.setSwitch(true));
                break;
            case "off":
                await this.runCommandWithOptimisticCapability('onoff', false, () => this.device.setSwitch(false));
                break;
            case 'turbo':
                await this.runCommandWithOptimisticCapability('onoff', true, () => this.device.setTowerFanMode(DeviceModes.Turbo));
                break;
            case 'normal':
                await this.runCommandWithOptimisticCapability('onoff', true, () => this.device.setTowerFanMode(DeviceModes.Normal));
                break;
            case 'auto':
                await this.runCommandWithOptimisticCapability('onoff', true, () => this.device.setTowerFanMode(DeviceModes.Auto));
                break;
            case 'eco':
                await this.runCommandWithOptimisticCapability('onoff', true, () => this.device.setTowerFanMode(DeviceModes.Eco));
                break;
            case 'advancedSleep':
                await this.runCommandWithOptimisticCapability('onoff', true, () => this.device.setTowerFanMode(DeviceModes.AdvancedSleep));
                break;
            default:
                this.error("Unknown mode: " + value);
                break;
        }
        void this.updateDevice();
    }

    public async getDevice(setAvailableOnSuccess = true): Promise<void> {
        const veSync: VeSync = (this.homey.app as VeSyncApp).veSync;
        if (veSync === null || !veSync.isLoggedIn()) {
            await this.setUnavailable(this.homey.__("devices.failed_login"));
            throw new Error("Failed to login. Please use the repair function.");
        }

        const device = this.findStoredVeSyncDevice(veSync.getStoredDevice());

        if (!(device instanceof BasicTowerFan)) {
            this.error("Device is undefined or is not a VeSyncTowerFan");
            await this.setUnavailable(this.homey.__("devices.not_found"));
            throw new Error("Device is undefined or is not a VeSyncTowerFan");
        }

        this.device = device;
        const status = await this.device.getTowerFanStatus().catch(async (reason: unknown) => {
            const message = getErrorMessage(reason);
            await this.handleDeviceStatusFailure(message);
            return null;
        });

        if (!status) {
            throw new Error("Cannot get device status. Device status request failed");
        }

        if (status.msg !== "request success") {
            await this.handleDeviceStatusFailure(status.msg);
            throw new Error("Cannot get device status. Device is " + status.msg);
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
        const status = await this.device.getTowerFanStatus().catch(async (reason: unknown) => {
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

        // Fan speed updates
        const fanSpeedLevel = status.result.result.fanSpeedLevel ?? 0;
        await this.setCapabilityIfPresent('fanSpeed0to3', fanSpeedLevel);
        await this.setCapabilityIfPresent('fanSpeed0to4', fanSpeedLevel);
        await this.setCapabilityIfPresent('fanSpeed0to5', fanSpeedLevel);
        await this.setCapabilityIfPresent('fanSpeed0to9', fanSpeedLevel);
        await this.setCapabilityIfPresent('fanSpeed0to12', fanSpeedLevel);

        // Other status updates
        await this.setCapabilityIfPresent('measure_temperature', status.result.result.temperature);
        await this.setCapabilityIfPresent('onoff', Boolean(status.result.result.powerSwitch));
        await this.setCapabilityIfPresent('oscillation_toggle', Boolean(status.result.result.oscillationState));
        await this.setCapabilityIfPresent('display_toggle', Boolean(status.result.result.screenState));
        await this.setCapabilityIfPresent('mute_toggle', Boolean(status.result.result.muteState));
    }
}
