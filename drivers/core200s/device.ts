import PurifierDeviceBase from "../../lib/PurifierDeviceBase";

class Core200S extends PurifierDeviceBase {
    private capabilitiesAddition: string[] = [
        "core200sCapability",
        "fanSpeed0to3",
        "onoff",
        "measure_filter_life",
        "alarm_filter_life",
        "display_toggle",
        "nightlight_toggle",
    ]

    async onInit() {
        this.capabilitiesAddition.forEach((c) => this.checkForCapability(c));
        await super.onInit();
        this.registerCapabilityListener("onoff", async (value) => {
            if (!value) await this.setCapabilityValue("core200sCapability", "off");
            await this.setMode(value ? "on" : "off");
            await this.updateDevice();
        });
        this.registerCapabilityListener("core200sCapability", async (value) => {
            if (value === "off") await this.setCapabilityValue("onoff", false);
            else await this.setCapabilityValue("onoff", true);
            await this.setMode(value);
        });

        this.registerCapabilityListener("fanSpeed0to3", async (value) => {
            if (value === 0) await this.triggerCapabilityListener("onoff", false);
            else {
                await this.setCapabilityValue("onoff", true);
                await this.setCapabilityValue("core200sCapability", "manual");
                await this.setMode("fan_speed_" + value);
            }
        });
        this.log('Core200S has been initialized');
    }

    async setMode(mode: string) {
        if (!this.device.status) {
            this.error("Core200S is not connected");
            return;
        }
        await super.setMode(mode);
    }

    async updateDevice(): Promise<void> {
        await super.updateDevice().catch(this.error);
        if (this.device.status && this.getAvailable()) {
            this.setCapabilityValue('onoff', this.device.status.enabled).catch(this.error);
            if (this.hasCapability("core200sCapability")) {
                if (this.device.status.mode === "manual")
                    this.setCapabilityValue("core200sCapability", "manual").catch(this.error);
                if (this.device.status.mode === "sleep")
                    this.setCapabilityValue('core200sCapability', "sleep").catch(this.error);
                if (!this.device.status.enabled)
                    this.setCapabilityValue('core200sCapability', "off").catch(this.error);
            }
        }
        this.log("Updating device status!");
    }

    async onAdded() {
        this.log('Core200S has been added');
    }

    async onSettings({oldSettings: {}, newSettings: {}, changedKeys: []}): Promise<string | void> {
        this.log('Core200S settings where changed');
    }

    async onRenamed(name: string) {
        this.log('Core200S was renamed');
    }

}

module.exports = Core200S;
