import HumidifierDeviceBase from "../../lib/HumidifierDeviceBase";


class Classic200s extends HumidifierDeviceBase {

    private capabilitiesAddition: string[] = [
        "classic200sCapability",
        "onoff",
        "measure_humidity",
        "alarm_water_lacks",
        "fanSpeed0to9",
        "display_toggle",
    ]

    /**
     * onInit is called when the device is initialized.
     */
    async onInit() {
        this.capabilitiesAddition.forEach((c) => this.checkForCapability(c));
        await super.onInit();
        this.registerCapabilityListener("onoff", async (value) => {
            if (!value) await this.setCapabilityValue("classic200sCapability", "off");
            await this.setMode(value ? "on" : "off");
            await this.updateDevice();
        });
        this.registerCapabilityListener("classic200sCapability", async (value) => {
            if (value === "off") await this.setCapabilityValue("onoff", false);
            else await this.setCapabilityValue("onoff", true);
            await this.setMode(value);
        });

        this.registerCapabilityListener("fanSpeed0to9", async (value) => {
            if (value === 0) await this.triggerCapabilityListener("onoff", false);
            else {
                await this.setCapabilityValue("onoff", true);
                await this.setCapabilityValue("classic200sCapability", "manual");
                await this.setMode("fan_speed_" + value);
            }
        })
        this.log('Classic200s has been initialized');
    }

    async setMode(value: string) {
        if (!this.device.isConnected()) {
            this.error("Classic200s is not connected");
            return;
        }
        await super.setMode(value);
    }

    async updateDevice(): Promise<void> {
        await super.updateDevice();
        if (this.device.isConnected() && this.getAvailable()) {
            this.setCapabilityValue('onoff', this.device.isOn()).catch(this.error);
            if (this.hasCapability("classic200sCapability")) {
                if (this.device.mode === "manual")
                    this.setCapabilityValue("classic200sCapability", "manual").catch(this.error);
                if (this.device.mode === "auto")
                    this.setCapabilityValue('classic200sCapability', "auto").catch(this.error);
                if (!this.device.isOn())
                    this.setCapabilityValue('classic200sCapability', "off").catch(this.error);
            }
        }
        this.log("Updating device status!");
    }

    async onAdded() {
        this.log('Classic200s has been added');
    }

    async onSettings(settings: { oldSettings: any, newSettings: any, changedKeys: string[] }): Promise<string | void> {
        await super.onSettings(settings);
        this.log('Classic200s settings where changed');
    }

    async onRenamed(name: string) {
        this.log('Classic200s was renamed');
    }

    async onDeleted() {
        this.log('Classic200s has been deleted');
    }

}

module.exports = Classic200s;
