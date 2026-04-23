import HumidifierDeviceBase from "../../lib/HumidifierDeviceBase";


class SproutHumidifier extends HumidifierDeviceBase {
    private capabilitiesAddition: string[] = [
        "sproutHumidifierCapability",
        "onoff",
        "measure_humidity",
        "alarm_water_lacks",
        "fanSpeed0to2",
        "display_toggle",
        "nightlight_toggle"
    ]

    /**
     * onInit is called when the device is initialized.
     */
    async onInit() {
        this.capabilitiesAddition.forEach((c) => this.checkForCapability(c));
        await super.onInit();
        this.registerCapabilityListener("onoff", async (value) => {
            if (!value) await this.setCapabilityValue("sproutHumidifierCapability", "off");
            await this.setMode(value ? "on" : "off");
            await this.updateDevice();
        });
        this.registerCapabilityListener("sproutHumidifierCapability", async (value) => {
            if (value === "off") await this.setCapabilityValue("onoff", false);
            else await this.setCapabilityValue("onoff", true);
            await this.setMode(value);
        });

        this.registerCapabilityListener("fanSpeed0to2", async (value) => {
            if (value === 0) await this.triggerCapabilityListener("onoff", false);
            else {
                await this.setCapabilityValue("onoff", true);
                await this.setCapabilityValue("sproutHumidifierCapability", "manual");
                await this.setMode("fan_speed_" + value);
            }
        })
        this.log('SproutHumidifier has been initialized');
    }

    async setMode(value: string) {
        if (!this.device.device) {
            this.error("SproutHumidifier is not connected");
            return;
        }
        await super.setMode(value);
    }

    async updateDevice(): Promise<void> {
        await super.updateDevice();
        if (this.device.status && this.getAvailable()) {
            this.setCapabilityValue('onoff', this.device.status.enabled).catch(this.error);
            if (this.hasCapability("sproutHumidifierCapability")) {
                if (this.device.status.mode === "manual")
                    this.setCapabilityValue("sproutHumidifierCapability", "manual").catch(this.error);
                if (this.device.status.mode === "sleep")
                    this.setCapabilityValue('sproutHumidifierCapability', "sleep").catch(this.error);
                if (this.device.status.mode === "auto")
                    this.setCapabilityValue('sproutHumidifierCapability', "auto").catch(this.error);
                if (!this.device.status.enabled)
                    this.setCapabilityValue('sproutHumidifierCapability', "off").catch(this.error);
            }
        }
        this.log("Updating device status!");
    }

    async onAdded() {
        this.log('SproutHumidifier has been added');
    }

    async onSettings(settings: { oldSettings: any, newSettings: any, changedKeys: string[] }): Promise<string | void> {
        await super.onSettings(settings);
        this.log('SproutHumidifier settings where changed');
    }

    async onRenamed(name: string) {
        this.log('SproutHumidifier was renamed');
    }

    async onDeleted() {
        await super.onDeleted();
        this.log('SproutHumidifier has been deleted');
    }

}

module.exports = SproutHumidifier;
