import Homey from "homey";
import VeSync from "../tsvesync/veSync";
import VeSyncApp from "../app";
import VeSyncTowerFan from "../tsvesync/veSyncTowerFan";

export default class TowerFanDeviceBase extends Homey.Device {
    device!: VeSyncTowerFan;
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
            if(level > 0) await this.device.setFanSpeed(level).catch(this.error);
            else await this.device.off().catch(this.error);
            void this.updateDevice();
            return;
        }
        switch (value) {
            case "on":
                await this.device.on().catch(this.error);
                break;
            case "off":
                await this.device.off().catch(this.error);
                break;
            case 'turbo':
                await this.device.setMode('turbo').catch(this.error);
                break;
            case 'normal':
                await this.device.setMode('normal').catch(this.error);
                break;
            case 'auto':
                await this.device.setMode('auto').catch(this.error);
                break;
            case 'advancedSleep':
                await this.device.setMode('advancedSleep').catch(this.error);
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
            let device = veSync.getStoredDevice().find(d => d.uuid === this.getData().id);
            if (device === undefined || !(device instanceof VeSyncTowerFan)) {
                this.error("Device is undefined or is not a VeSyncTowerFan");
                await this.setUnavailable(this.homey.__("devices.not_found"));
                return reject("Device is undefined or is not a VeSyncTowerFan");
            }
            this.device = device as VeSyncTowerFan;
            await this.device.getStatus().catch(this.error);
            if (this.device.isConnected()) {
                await this.setAvailable().catch(this.error);
                return resolve();
            }
            await this.setUnavailable(this.homey.__("devices.offline"))
            return reject("Cannot get device status. Device is " + this.device.connectionStatus);
        })
    }

    async updateDevice(): Promise<void> {
        //Getting latest device status
        await this.device.getStatus().catch(async (reason: Error) => {
            switch (reason.message) {
                case "device offline":
                    this.setUnavailable(this.homey.__("devices.offline")).catch(this.error);
                    return;
                default:
                    await this.setUnavailable(reason.message).catch(this.error);
                    this.error(reason);
                    return;
            }
        });
        if (this.device.isConnected()) {
            if (!this.getAvailable())
                await this.setAvailable().catch(this.error);
            if (this.hasCapability("fanSpeed0to3"))
                this.setCapabilityValue('fanSpeed0to3', this.device.fan_level ?? 0).catch(this.error);
            if (this.hasCapability("fanSpeed0to4"))
                this.setCapabilityValue('fanSpeed0to4', this.device.fan_level ?? 0).catch(this.error);
            if (this.hasCapability("fanSpeed0to5"))
                this.setCapabilityValue('fanSpeed0to5', this.device.fan_level ?? 0).catch(this.error);
            if (this.hasCapability("fanSpeed0to9"))
                this.setCapabilityValue('fanSpeed0to9', this.device.fan_level ?? 0).catch(this.error);
            if (this.hasCapability("fanSpeed0to12"))
                this.setCapabilityValue('fanSpeed0to12', this.device.fan_level ?? 0).catch(this.error);
            if (this.hasCapability('measure_temperature'))
                this.setCapabilityValue('measure_temperature', this.device.air_temperature).catch(this.error);
            if (this.hasCapability('onoff'))
                this.setCapabilityValue('onoff', this.device.isOn()).catch(this.error);
            if (this.hasCapability('oscillation_toggle'))
                this.setCapabilityValue('oscillation_toggle', this.device.oscillation_switch).catch(this.error);
            if (this.hasCapability('display_toggle'))
                this.setCapabilityValue('display_toggle', this.device.display).catch(this.error);
            if (this.hasCapability('mute_toggle'))
                this.setCapabilityValue('mute_toggle', this.device.mute_switch).catch(this.error);


        }
    }

    async checkForCapability(capability: string) {
        if (!this.hasCapability(capability))
            await this.addCapability(capability).catch(this.error);
    }

}
