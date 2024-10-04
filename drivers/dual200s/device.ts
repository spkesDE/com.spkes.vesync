import HumidifierDeviceBase from "../../lib/HumidifierDeviceBase";

class Dual200s extends HumidifierDeviceBase {
    private capabilitiesAddition: string[] = [
        "dual200sCapability",
        "fanSpeed0to3",
        "onoff",
        "measure_humidity",
        "alarm_water_lacks",
        "display_toggle"
    ]

    async onInit() {
        this.capabilitiesAddition.forEach((c) => this.checkForCapability(c));
        await super.onInit();
        this.registerCapabilityListener("onoff", async (value) => {
            if (!value) await this.setCapabilityValue("dual200sCapability", "off");
            await this.setMode(value ? "on" : "off");
            await this.updateDevice();
        });
        this.registerCapabilityListener("dual200sCapability", async (value) => {
            if (value === "off") await this.setCapabilityValue("onoff", false);
            else  await this.setCapabilityValue("onoff", true);
            await this.setMode(value);
        });
        this.registerCapabilityListener("fanSpeed0to3", async (value) => {
            if (value === 0) await this.triggerCapabilityListener("onoff", false);
            else {
                await this.setCapabilityValue("onoff", true);
                await this.setCapabilityValue("dual200sCapability", "manual");
                await this.setMode("fan_speed_" + value);
            }
        });

        this.log('Dual200s has been initialized');
    }

    async setMode(value: string) {
        if (!this.device.status) {
            this.error("Dual200S is not connected");
            return;
        }
        await super.setMode(value);
    }

    async updateDevice(): Promise<void> {
        await super.updateDevice();
        if (this.device.status && this.getAvailable()) {
            this.setCapabilityValue('onoff', this.device.status.enabled).catch(this.error);
            if (this.hasCapability("dual200sCapability")) {
                if (this.device.status.mode === "manual")
                    this.setCapabilityValue('dual200sCapability', "manual").catch(this.error);
                if (this.device.status.mode === "sleep")
                    this.setCapabilityValue('dual200sCapability', "sleep").catch(this.error);
                if (this.device.status.mode === "auto")
                    this.setCapabilityValue('dual200sCapability', "auto").catch(this.error);
                if (!this.device.status.enabled)
                    this.setCapabilityValue('dual200sCapability', "off").catch(this.error);
            }
        }
        this.log("Updating device status!");
    }

    async onAdded() {
        this.log('Dual200s has been added');
    }

    async onSettings({oldSettings: {}, newSettings: {}, changedKeys: []}): Promise<string | void> {
        this.log('Dual200s settings where changed');
    }

    async onRenamed(name: string) {
        this.log('Dual200s was renamed');
    }

    async onDeleted() {
        this.log('Dual200s has been deleted');
    }

}

module.exports = Dual200s;
