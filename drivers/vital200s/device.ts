import PurifierDeviceBase from "../../lib/PurifierDeviceBase";

class Vital200s extends PurifierDeviceBase {
    private capabilitiesAddition: string[] = [
        "vital200sCapability",
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
            if (!value) await this.setCapabilityValue("vital200sCapability", "off");
            await this.setMode(value ? "on" : "off");
            await this.updateDevice();
        });
        this.registerCapabilityListener("vital200sCapability", async (value) => {
            if (value === "off") await this.setCapabilityValue("onoff", false);
            else await this.setCapabilityValue("onoff", true);
            await this.setMode(value);
        });

        this.registerCapabilityListener("fanSpeed0to4", async (value) => {
            if (value === 0) await this.triggerCapabilityListener("onoff", false);
            else {
                await this.setCapabilityValue("onoff", true);
                await this.setCapabilityValue("vital200sCapability", "manual");
                await this.setMode("fan_speed_" + value);
            }
        })

        this.log('Vital200s has been initialized');
    }

    async setMode(value: string) {
        if (!this.device.isConnected()) {
            this.error("Vital200s is not connected");
            return;
        }
        await super.setMode(value);
    }

    async onAdded() {
        this.log('Vital200s has been added');
    }


    async onSettings({oldSettings: {}, newSettings: {}, changedKeys: []}): Promise<string | void> {
        this.log('Vital200s settings where changed');
    }

    async onRenamed(name: string) {
        this.log('Vital200s was renamed');
    }

    async onDeleted() {
        this.log('Vital200s has been deleted');
    }

    async updateDevice(): Promise<void> {
        await super.updateDevice();
        if (this.device.isConnected() && this.getAvailable()) {
            this.setCapabilityValue('onoff', this.device.isOn()).catch(this.error);
            if (this.hasCapability("vital200sCapability")) {
                if (this.device.mode === "manual")
                    this.setCapabilityValue('vital200sCapability', "manual").catch(this.error);
                if (this.device.mode === "sleep")
                    this.setCapabilityValue('vital200sCapability', "sleep").catch(this.error);
                if (this.device.mode === "auto")
                    this.setCapabilityValue('vital200sCapability', "auto").catch(this.error)
                if (this.device.mode === "pet")
                    this.setCapabilityValue('vital200sCapability', "pet").catch(this.error)
                if (!this.device.isOn())
                    this.setCapabilityValue('vital200sCapability', "off").catch(this.error);
            }

        }
        this.log("Updating device status!");
    }

}

module.exports = Vital200s;
