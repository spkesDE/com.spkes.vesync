import HumidifierDeviceBase from "../../lib/HumidifierDeviceBase";

class LV600S extends HumidifierDeviceBase {
    private capabilitiesAddition: string[] = [
        "lv600sCapability",
        "onoff",
        "measure_humidity",
        "alarm_water_lacks",
        "fanSpeed0to9",
        "warmFanSpeed0to3",
        "display_toggle"
    ]

    //TODO: Flow for: Fan Speed, Warm Mist Speed, Display, Night light
    //TODO: Device Settings target Humidity


    async onInit() {
        await super.onInit();

        this.registerCapabilityListener("onoff", async (value) => {
            if (!value) this.setCapabilityValue("lv600sCapability", "off").then();
            await this.setMode(value ? "on" : "off");
            await this.updateDevice();
        });
        this.registerCapabilityListener("lv600sCapability", async (value) => {
            if (value === "off") this.setCapabilityValue("onoff", false).then();
            else this.setCapabilityValue("onoff", true).then();
            await this.setMode(value);
        });
        this.registerCapabilityListener("lv600sWarmCapability", async (value) => {
            if (value === "off") this.setCapabilityValue("onoff", false).then();
            else this.setCapabilityValue("onoff", true).then();
            await this.setMode(value);
        });

        this.registerCapabilityListener("fanSpeed0to9", async (value) => {
            if (value === 0) this.triggerCapabilityListener("onoff", false).then();
            else {
                this.setCapabilityValue("onoff", true).then();
                this.setCapabilityValue("lv600sCapability", "manual").then();
                await this.setMode("fan_speed_" + value);
            }
        })

        this.registerCapabilityListener("warmFanSpeed0to3", async (value) => {
            await this.setMode("warm_fan_speed_" + value);
        })

        this.capabilitiesAddition.forEach((c) => this.checkForCapability(c))

        this.log('LV600S has been initialized');
    }

    async onAdded() {
        this.log('LV600S has been added');
    }

    async onSettings({oldSettings: {}, newSettings: {}, changedKeys: []}): Promise<string | void> {
        this.log('LV600S settings where changed');
    }

    async onRenamed(name: string) {
        this.log('LV600S was renamed');
    }

    async onDeleted() {
        this.log('LV600S has been deleted');
    }

    async setMode(value: string) {
        if (!this.device.isConnected()) {
            this.error("LV600S is not connected");
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
            if (this.hasCapability("lv600sCapability")) {
                if (this.device.mode === "manual")
                    this.setCapabilityValue('lv600sCapability', "manual").catch(this.error);
                if (this.device.mode === "sleep")
                    this.setCapabilityValue('lv600sCapability', "sleep").catch(this.error);
                if (this.device.mode === "auto" || this.device.mode === "humidity")
                    this.setCapabilityValue('lv600sCapability', "auto").catch(this.error);
                if (!this.device.isOn())
                    this.setCapabilityValue('lv600sCapability', "off").catch(this.error);
            }
            if (this.hasCapability("lv600sWarmCapability") && this.device.isOn()) {
                this.setCapabilityValue('lv600sWarmCapability', "warm_fan_speed_" + this.device.warm_mist_level).catch(this.error);
            }
            this.log("Device has been updated!");
        }
    }


}

module.exports = LV600S;
