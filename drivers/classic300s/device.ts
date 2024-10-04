import HumidifierDeviceBase from "../../lib/HumidifierDeviceBase";


class Classic300s extends HumidifierDeviceBase {

    private capabilitiesAddition: string[] = [
        "classic300sCapability",
        "onoff",
        "measure_humidity",
        "alarm_water_lacks",
        "fanSpeed0to9",
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
            if (!value) await this.setCapabilityValue("classic300sCapability", "off");
            await this.setMode(value ? "on" : "off");
            await this.updateDevice();
        });
        this.registerCapabilityListener("classic300sCapability", async (value) => {
            if (value === "off") await this.setCapabilityValue("onoff", false);
            else await this.setCapabilityValue("onoff", true);
            await this.setMode(value);
        });

        this.registerCapabilityListener("fanSpeed0to9", async (value) => {
            if (value === 0) await this.triggerCapabilityListener("onoff", false);
            else {
                await this.setCapabilityValue("onoff", true);
                await this.setCapabilityValue("classic300sCapability", "manual");
                await this.setMode("fan_speed_" + value);
            }
        })
        this.log('Classic300s has been initialized');
    }

    async setMode(value: string) {
        if (!this.device.status) {
            this.error("Classic300s is not connected");
            return;
        }
        await super.setMode(value);
    }

    async updateDevice(): Promise<void> {
        await super.updateDevice();
        if (this.device.status && this.getAvailable()) {
            this.setCapabilityValue('onoff', this.device.status.enabled).catch(this.error);
            if (this.hasCapability("classic300sCapability")) {
                if (this.device.status.mode === "manual")
                    this.setCapabilityValue("classic300sCapability", "manual").catch(this.error);
                if (this.device.status.mode === "sleep")
                    this.setCapabilityValue('classic300sCapability', "sleep").catch(this.error);
                if (this.device.status.mode === "auto")
                    this.setCapabilityValue('classic300sCapability', "auto").catch(this.error);
                if (!this.device.status.enabled)
                    this.setCapabilityValue('classic300sCapability', "off").catch(this.error);
            }
        }
        this.log("Updating device status!");
    }

    async onAdded() {
        this.log('Classic300s has been added');
    }

    async onSettings(settings: { oldSettings: any, newSettings: any, changedKeys: string[] }): Promise<string | void> {
        await super.onSettings(settings);
        this.log('Classic300s settings where changed');
    }

    async onRenamed(name: string) {
        this.log('Classic300s was renamed');
    }

    async onDeleted() {
        this.log('Classic300s has been deleted');
    }

}

module.exports = Classic300s;
