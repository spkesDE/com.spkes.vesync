import PurifierDeviceBase from "../../lib/PurifierDeviceBase";

class SproutAir extends PurifierDeviceBase {
    private capabilitiesAddition: string[] = [
        "sproutAirCapability",
        "fanSpeed0to3",
        "onoff",
        "measure_pm25",
        "alarm_pm25",
        "display_toggle",
        "nightlight_toggle"
    ]

    async onInit() {
        this.capabilitiesAddition.forEach((c) => this.checkForCapability(c));
        await super.onInit();

        this.registerCapabilityListener("onoff", async (value) => {
            if (!value) await this.setCapabilityValue("sproutAirCapability", "off");
            await this.setMode(value ? "on" : "off");
            await this.updateDevice();
        });
        this.registerCapabilityListener("sproutAirCapability", async (value) => {
            if (value === "off") await this.setCapabilityValue("onoff", false);
            else await this.setCapabilityValue("onoff", true);
            await this.setMode(value);
        });

        this.registerCapabilityListener("fanSpeed0to3", async (value) => {
            if (value === 0) await this.triggerCapabilityListener("onoff", false);
            else {
                await this.setCapabilityValue("onoff", true);
                await this.setCapabilityValue("sproutAirCapability", "manual");
                await this.setMode("fan_speed_" + value);
            }
        })

        this.log('SproutAir has been initialized');
    }

    async setMode(value: string) {
        await super.setMode(value);
    }

    async onAdded() {
        this.log('SproutAir has been added');
    }


    async onSettings({oldSettings: {}, newSettings: {}, changedKeys: []}): Promise<string | void> {
        this.log('SproutAir settings where changed');
    }

    async onRenamed(name: string) {
        this.log('SproutAir was renamed');
    }

    async onDeleted() {
        await super.onDeleted();
        this.log('SproutAir has been deleted');
    }

    async updateDevice(): Promise<void> {
        await super.updateDevice();
        if (this.device.status) {
            if (this.hasCapability("sproutAirCapability")) {
                if (this.device.status?.mode === "manual")
                    this.setCapabilityValue('sproutAirCapability', "manual").catch(this.error);
                if (this.device.status.mode === "sleep")
                    this.setCapabilityValue('sproutAirCapability', "sleep").catch(this.error);
                if (this.device.status.mode === "auto")
                    this.setCapabilityValue('sproutAirCapability', "auto").catch(this.error)
                if (!this.device.status.enabled)
                    this.setCapabilityValue('sproutAirCapability', "off").catch(this.error);
            }
        }
        this.log("Updating device status!");
    }

}

module.exports = SproutAir;
