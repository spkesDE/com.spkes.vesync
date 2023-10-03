import PurifierDeviceBase from "../../lib/PurifierDeviceBase";

class Core600s extends PurifierDeviceBase {
    private capabilitiesAddition: string[] = [
        "core600sCapability",
        "fanSpeed0to4",
        "onoff",
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
            if (!value) await this.setCapabilityValue("core600sCapability", "off");
            await this.setMode(value ? "on" : "off");
            await this.updateDevice();
        });
        this.registerCapabilityListener("core600sCapability", async (value) => {
            if (value === "off") await this.setCapabilityValue("onoff", false);
            else await this.setCapabilityValue("onoff", true);
            await this.setMode(value);
        });

        this.registerCapabilityListener("fanSpeed0to4", async (value) => {
            if (value === 0) await this.triggerCapabilityListener("onoff", false);
            else {
                await this.setCapabilityValue("onoff", true);
                await this.setCapabilityValue("core600sCapability", "manual");
                await this.setMode("fan_speed_" + value);
            }
        })

        this.log('Core600s has been initialized');
    }

    async setMode(value: string) {
        if (!this.device.isConnected()) {
            this.error("Core600s is not connected");
            return;
        }
        await super.setMode(value);
    }

    async onAdded() {
        this.log('Core600s has been added');
    }


    async onSettings({oldSettings: {}, newSettings: {}, changedKeys: []}): Promise<string | void> {
        this.log('Core600s settings where changed');
    }

    async onRenamed(name: string) {
        this.log('Core600s was renamed');
    }

    async onDeleted() {
        this.log('Core600s has been deleted');
    }

    async updateDevice(): Promise<void> {
        await super.updateDevice();
        if (this.device.isConnected() && this.getAvailable()) {
            this.setCapabilityValue('onoff', this.device.isOn()).catch(this.error);
            if (this.hasCapability("core600sCapability")) {
                if (this.device.mode === "manual")
                    this.setCapabilityValue('core600sCapability', "manual").catch(this.error);
                if (this.device.mode === "sleep")
                    this.setCapabilityValue('core600sCapability', "sleep").catch(this.error);
                if (this.device.mode === "auto")
                    this.setCapabilityValue('core600sCapability', "auto").catch(this.error)
                if (!this.device.isOn())
                    this.setCapabilityValue('core600sCapability', "off").catch(this.error);
            }

        }
        this.log("Updating device status!");
    }

}

module.exports = Core600s;
