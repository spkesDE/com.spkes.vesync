import HumidifierDeviceBase from "../../lib/HumidifierDeviceBase";
import Oasis450SDevice from "../../tsvesync/devices/humidifier/Oasis450S";
import DeviceModes from "../../tsvesync/enum/DeviceModes";

class Oasis450S extends HumidifierDeviceBase {
    private capabilitiesAddition: string[] = []

    device!: Oasis450SDevice

    async onInit() {
        await super.onInit();

        this.registerCapabilityListener("onoff", async (value) => {
            if (!value) this.setCapabilityValue("oasis450sCapability", "off").then();
            await this.setMode(value ? "on" : "off");
            await this.updateDevice();
        });
        this.registerCapabilityListener("oasis450sCapability", async (value) => {
            if (value === "off") this.setCapabilityValue("onoff", false).then();
            else this.setCapabilityValue("onoff", true).then();
            await this.setMode(value);
        });
        this.registerCapabilityListener("fanSpeed0to9", async (value) => {
            if (value === 0) this.triggerCapabilityListener("onoff", false).then();
            else {
                this.setCapabilityValue("onoff", true).then();
                this.setCapabilityValue("oasis450sCapability", "manual").then();
                await this.setMode("fan_speed_" + value);
            }
        })

        this.registerCapabilityListener("warmFanSpeed0to3", async (value) => {
            await this.setMode("warm_fan_speed_" + value);
        })

        this.capabilitiesAddition.forEach((c) => this.checkForCapability(c))

        this.log('Oasis450S has been initialized');
    }

    async onAdded() {
        this.log('Oasis450S has been added');
    }

    async onSettings({oldSettings: {}, newSettings: {}, changedKeys: []}): Promise<string | void> {
        this.log('Oasis450S settings where changed');
    }

    async onRenamed(name: string) {
        this.log('Oasis450S was renamed');
    }

    async onDeleted() {
        this.log('Oasis450S has been deleted');
    }

    async setMode(value: string) {
        if (!this.device.status) {
            this.error("Oasis450S is not connected");
            return;
        }
        if (value.startsWith("fan_speed_")) {
            this.log("Mode: " + value);
            let level = Number(value.replace("fan_speed_", ""));
            if (this.device.status.mode === "sleep")
                await this.device.setHumidityMode(DeviceModes.Humidity).catch(this.error);
            this.device.setLevel(level).catch(this.error);
            return;
        }
        if (value.startsWith("warm_fan_speed_")) {
            let level = Number(value.replace("warm_fan_speed_", ""));
            this.device?.setWarmLevel(level).catch(this.error);
            return;
        }
        if (value === "auto") {
            this.log("Mode: " + value);
            if (!this.device.status.enabled)
                await this.device.setSwitch(true).catch(this.error);
            this.device.setHumidityMode(DeviceModes.Humidity).catch(this.error);
            return;
        }
        await super.setMode(value);
    }

    async updateDevice(): Promise<void> {
        await super.updateDevice();
        if (this.device.status && this.getAvailable()) {
            this.setCapabilityValue('onoff', this.device.status.enabled).catch(this.error);
            if (this.hasCapability("oasis450sCapability")) {
                if (this.device.status.mode === "manual")
                    this.setCapabilityValue('oasis450sCapability', "manual").catch(this.error);
                if (this.device.status.mode === "sleep")
                    this.setCapabilityValue('oasis450sCapability', "sleep").catch(this.error);
                if (this.device.status.mode === "auto" || this.device.status.mode === "humidity")
                    this.setCapabilityValue('oasis450sCapability', "auto").catch(this.error);
                if (!this.device.status.enabled)
                    this.setCapabilityValue('oasis450sCapability', "off").catch(this.error);
            }
            if (this.hasCapability("oasis450sWarmCapability") && this.device.status.enabled) {
                this.setCapabilityValue('oasis450sWarmCapability', "warm_fan_speed_" + this.device.status.warm_mist_level).catch(this.error);
            }
            this.log("Device has been updated!");
        }
    }


}

module.exports = Oasis450S;
