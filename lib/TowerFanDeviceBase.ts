import Homey from "homey";
import VeSync from "../tsvesync/VeSync";
import VeSyncApp from "../app";
import BasicTowerFan from "../tsvesync/lib/BasicTowerFan";
import DeviceModes from "../tsvesync/enum/DeviceModes";


export default class TowerFanDeviceBase extends Homey.Device {
    device!: BasicTowerFan;
    private updateInterval!: NodeJS.Timer;

    async onInit() {
        await this.getDevice().catch(this.log);
        await this.updateDevice().catch(this.error);
        this.updateInterval = this.homey.setInterval(async () => this.updateDevice().catch(this.error), 1000 * 60);

        if (this.hasCapability("onoff")) this.registerCapabilityListener("onoff", async (value) => {
            if (!value) await this.setCapabilityValue("onoff", false);
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
                await this.device.setLevel(level).catch(this.error);
            } else await this.setMode("off");
            void this.updateDevice();
            return;
        }
        switch (value) {
            case "on":
                await this.device.setSwitch(true).catch(this.error)
                break;
            case "off":
                await this.device.setSwitch(false).catch(this.error)
                break;
            case 'turbo':
                await this.device.setTowerFanMode(DeviceModes.Turbo).catch(this.error)
                break;
            case 'normal':
                await this.device.setTowerFanMode(DeviceModes.Normal).catch(this.error)
                break;
            case 'auto':
                await this.device.setTowerFanMode(DeviceModes.Auto).catch(this.error)
                break;
            case 'advancedSleep':
                await this.device.setTowerFanMode(DeviceModes.AdvancedSleep).catch(this.error)
                break;
            default:
                this.error("Unknown mode: " + value);
                break;
        }
        void this.updateDevice();
    }

    public async getDevice(): Promise<void> {
        return new Promise(async (resolve, reject) => {
            let veSync: VeSync = (this.homey.app as VeSyncApp).veSync;
            if (veSync === null || !veSync.isLoggedIn()) {
                await this.setUnavailable(this.homey.__("devices.failed_login"));
                return reject("Failed to login. Please use the repair function.");
            }
            let device = veSync.getStoredDevice().find(d => d.device.uuid === this.getData().id);
            if (device === undefined || !(device instanceof BasicTowerFan)) {
                this.error("Device is undefined or is not a VeSyncTowerFan");
                await this.setUnavailable(this.homey.__("devices.not_found"));
                return reject("Device is undefined or is not a VeSyncTowerFan");
            }
            this.device = device as BasicTowerFan;
            const status = await this.device.getTowerFanStatus();
            if (status.msg === "request success") {
                await this.setAvailable().catch(this.error);
                return resolve();
            }
            await this.setUnavailable(this.homey.__("devices.offline"))
            return reject("Cannot get device status. Device is " + status.msg);
        })
    }

    async updateDevice(): Promise<void> {
        // Get the latest device status
        const status = await this.device.getTowerFanStatus().catch(async (reason: Error) => {
            if (reason.message === "device offline") {
                await this.setUnavailable(this.homey.__("devices.offline")).catch(this.error);
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
                await this.setUnavailable(this.homey.__("devices.offline")).catch(this.error);
            }
            return;
        }

        // Set the device as available
        if (!this.getAvailable()) {
            await this.setAvailable().catch(this.error);
        }

        // Helper function to update capability
        const updateCapability = async (capability: string, value: any) => {
            if (this.hasCapability(capability)) {
                await this.setCapabilityValue(capability, value).catch(this.error);
            }
        };

        // Fan speed updates
        const fanSpeedLevel = status.result.result.fanSpeedLevel ?? 0;
        await updateCapability('fanSpeed0to3', fanSpeedLevel);
        await updateCapability('fanSpeed0to4', fanSpeedLevel);
        await updateCapability('fanSpeed0to5', fanSpeedLevel);
        await updateCapability('fanSpeed0to9', fanSpeedLevel);
        await updateCapability('fanSpeed0to12', fanSpeedLevel);

        // Other status updates
        await updateCapability('measure_temperature', status.result.result.temperature);
        await updateCapability('onoff', Boolean(status.result.result.powerSwitch));
        await updateCapability('oscillation_toggle', Boolean(status.result.result.oscillationState));
        await updateCapability('display_toggle', Boolean(status.result.result.screenState));
        await updateCapability('mute_toggle', Boolean(status.result.result.muteState));
    }


    async checkForCapability(capability: string) {
        if (!this.hasCapability(capability))
            await this.addCapability(capability).catch(this.error);
    }

}
