import PurifierDeviceBase from "../../lib/PurifierDeviceBase";

class Core300S extends PurifierDeviceBase {
    private capabilitiesAddition: string[] = [
        "core300sCapability",
        "onoff",
        "fanSpeed0to5",
        "measure_pm25",
        "alarm_pm25",
        "measure_filter_life",
        "alarm_filter_life",
        "display_toggle"
    ]

    async onInit() {
        this.capabilitiesAddition.forEach((c) => this.checkForCapability(c));
        await super.onInit();
        this.registerCapabilityListener("onoff", async (value) => {
            if (!value) await this.setCapabilityValue("core300sCapability", "off");
            await this.setMode(value ? "on" : "off");
            await this.updateDevice();
        });
        this.registerCapabilityListener("core300sCapability", async (value) => {
            if (value === "off") await this.setCapabilityValue("onoff", false);
            else await this.setCapabilityValue("onoff", true);
            await this.setMode(value);
        });

        this.registerCapabilityListener("fanSpeed0to5", async (value) => {
            if (value === 0) await this.triggerCapabilityListener("onoff", false);
            else {
                await this.setCapabilityValue("onoff", true);
                await this.setCapabilityValue("core300sCapability", "manual");
                await this.setMode("fan_speed_" + value);
            }
        })

        this.log('Core300S has been initialized');
    }

    async setMode(value: string) {
        if (!this.device.status) {
            this.error("Core300S is not connected");
            return;
        }
        await super.setMode(value);
    }

    async onAdded() {
        this.log('Core300S has been added');
    }

    async onSettings({oldSettings: {}, newSettings: {}, changedKeys: []}): Promise<string | void> {
        this.log('Core300S settings where changed');
    }

    async onRenamed(name: string) {
        this.log('Core300S was renamed');
    }

    async onDeleted() {
        this.log('Core300S has been deleted');
    }

    async updateDevice(): Promise<void> {
        await super.updateDevice();
        if (this.device.status && this.getAvailable()) {
            this.setCapabilityValue('onoff', this.device.status.enabled).catch(this.error);
            if (this.hasCapability("core300sCapability")) {
                if (this.device.status.mode === "manual")
                    this.setCapabilityValue('core300sCapability', "manual").catch(this.error);
                if (this.device.status.mode === "sleep")
                    this.setCapabilityValue('core300sCapability', "sleep").catch(this.error);
                if (this.device.status.mode === "auto")
                    this.setCapabilityValue('core300sCapability', "auto").catch(this.error)
                if (!this.device.status.enabled)
                    this.setCapabilityValue('core300sCapability', "off").catch(this.error);
            }
        }
        this.log("Updating device status!");
    }


}

module.exports = Core300S;
