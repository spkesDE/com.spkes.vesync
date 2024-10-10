import Homey from "homey";
import VeSync from "../tsvesync/VeSync";
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
                await this.device.setNightLight(value ? "on" : "off").catch(this.error);
                this.log(`Night Light: ${value}`);
            });
        this.updateInterval = this.homey.setInterval(async () => this.updateDevice().catch(this.error), 1000 * 60);
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
            if (this.device.status?.mode !== "manual")
                await this.device.setPurifierMode(DeviceModes.Normal).catch(this.error)
            this.device.setLevel(this.device.status?.level ?? 1).catch(this.error);
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
        // Get the latest device status
        const status = await this.device.getPurifierStatus().catch(async (reason: Error) => {
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
    }


    async checkForCapability(capability: string) {
        if (!this.hasCapability(capability))
            await this.addCapability(capability).catch(this.error);
    }

}
