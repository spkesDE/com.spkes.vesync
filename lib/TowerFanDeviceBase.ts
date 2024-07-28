import Homey from "homey";
import VeSync from "../tsvesync/veSync";
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
                await this.device.setLevel({
                    manualSpeedLevel: level,
                    levelIdx: 0,
                    levelType: 'wind'
                }).catch(this.error);
            } else await this.setMode("off");
            void this.updateDevice();
            return;
        }
        switch (value) {
            case "on":
                await this.device.setSwitch({
                    powerSwitch: 1,
                    switchIdx: 0
                }).catch(this.error)
                break;
            case "off":
                await this.device.setSwitch({
                    powerSwitch: 0,
                    switchIdx: 0
                }).catch(this.error)
                break;
            case 'turbo':
                await this.device.setTowerFanMode({
                    workMode: DeviceModes.Turbo
                }).catch(this.error)
                break;
            case 'normal':
                await this.device.setTowerFanMode({
                    workMode: DeviceModes.Normal
                }).catch(this.error)
                break;
            case 'auto':
                await this.device.setTowerFanMode({
                    workMode: DeviceModes.Auto
                }).catch(this.error)
                break;
            case 'advancedSleep':
                await this.device.setTowerFanMode({
                    workMode: DeviceModes.AdvancedSleep
                }).catch(this.error)
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
        //Getting latest device status
        const status = await this.device.getTowerFanStatus();
        if (status.msg !== "request success") {
            this.error("Failed to get device status. " + status.msg);
            await this.setUnavailable(this.homey.__("devices.offline"));
            return;
        }
        if (!this.getAvailable())
            await this.setAvailable().catch(this.error);
        if (this.hasCapability("fanSpeed0to3"))
            this.setCapabilityValue('fanSpeed0to3', status.result.result.fanSpeedLevel ?? 0).catch(this.error);
        if (this.hasCapability("fanSpeed0to4"))
            this.setCapabilityValue('fanSpeed0to4', status.result.result.fanSpeedLevel ?? 0).catch(this.error);
        if (this.hasCapability("fanSpeed0to5"))
            this.setCapabilityValue('fanSpeed0to5', status.result.result.fanSpeedLevel ?? 0).catch(this.error);
        if (this.hasCapability("fanSpeed0to9"))
            this.setCapabilityValue('fanSpeed0to9', status.result.result.fanSpeedLevel ?? 0).catch(this.error);
        if (this.hasCapability("fanSpeed0to12"))
            this.setCapabilityValue('fanSpeed0to12', status.result.result.fanSpeedLevel ?? 0).catch(this.error);
        if (this.hasCapability('measure_temperature'))
            this.setCapabilityValue('measure_temperature', status.result.result.temperature).catch(this.error);
        if (this.hasCapability('onoff'))
            this.setCapabilityValue('onoff', Boolean(status.result.result.powerSwitch)).catch(this.error);
        if (this.hasCapability('oscillation_toggle'))
            this.setCapabilityValue('oscillation_toggle', Boolean(status.result.result.oscillationState)).catch(this.error);
        if (this.hasCapability('display_toggle'))
            this.setCapabilityValue('display_toggle', Boolean(status.result.result.screenState)).catch(this.error);
        if (this.hasCapability('mute_toggle'))
            this.setCapabilityValue('mute_toggle', Boolean(status.result.result.muteState)).catch(this.error);
    }

    async checkForCapability(capability: string) {
        if (!this.hasCapability(capability))
            await this.addCapability(capability).catch(this.error);
    }

}
