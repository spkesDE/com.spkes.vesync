import HumidifierDeviceBase from "../../lib/HumidifierDeviceBase";

class Oasis450S extends HumidifierDeviceBase {
    private capabilitiesAddition: string[] = []

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
        if (!this.device.isConnected()) {
            this.error("Oasis450S is not connected");
            return;
        }
        if (value.startsWith("fan_speed_")) {
            this.log("Mode: " + value);
            let level = Number(value.replace("fan_speed_", ""));
            if (this.device.mode === "sleep")
                await this.device.setHumidityMode("humidity").catch(this.error);
            this.device.setMistLevel(level).catch(this.error);
            return;
        }
        if (value === "auto") {
            this.log("Mode: " + value);
            if (!this.device.isOn())
                await this.device.on().catch(this.error);
            this.device.setHumidityMode("humidity").catch(this.error);
            return;
        }
        await super.setMode(value);
    }

    async updateDevice(): Promise<void> {
        await super.updateDevice();
        if (this.device.isConnected() && this.getAvailable()) {
            this.setCapabilityValue('onoff', this.device.isOn()).catch(this.error);
            if (this.hasCapability("oasis450sCapability")) {
                if (this.device.mode === "manual")
                    this.setCapabilityValue('oasis450sCapability', "manual").catch(this.error);
                if (this.device.mode === "sleep")
                    this.setCapabilityValue('oasis450sCapability', "sleep").catch(this.error);
                if (this.device.mode === "auto" || this.device.mode === "humidity")
                    this.setCapabilityValue('oasis450sCapability', "auto").catch(this.error);
                if (!this.device.isOn())
                    this.setCapabilityValue('oasis450sCapability', "off").catch(this.error);
            }
            if (this.hasCapability("oasis450sWarmCapability") && this.device.isOn()) {
                this.setCapabilityValue('oasis450sWarmCapability', "warm_fan_speed_" + this.device.warm_mist_level).catch(this.error);
            }
            this.log("Device has been updated!");
        }
    }


}

module.exports = Oasis450S;
