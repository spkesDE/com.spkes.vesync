import PurifierDeviceBase from "../../lib/PurifierDeviceBase";

class Vital100s extends PurifierDeviceBase {
    private capabilitiesAddition: string[] = [
        "vital100sCapability",
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
            if (!value) await this.setCapabilityValue("vital100sCapability", "off");
            await this.setMode(value ? "on" : "off");
            await this.updateDevice();
        });
        this.registerCapabilityListener("vital100sCapability", async (value) => {
            if (value === "off") await this.setCapabilityValue("onoff", false);
            else await this.setCapabilityValue("onoff", true);
            await this.setMode(value);
        });

        this.registerCapabilityListener("fanSpeed0to4", async (value) => {
            if (value === 0) await this.triggerCapabilityListener("onoff", false);
            else {
                await this.setCapabilityValue("onoff", true);
                await this.setCapabilityValue("vital100sCapability", "manual");
                await this.setMode("fan_speed_" + value);
            }
        })

        this.log('Vital100s has been initialized');
    }

    async setMode(value: string) {
        if (!this.device.status) {
            this.error("Vital100s is not connected");
            return;
        }
        await super.setMode(value);
    }

    async onAdded() {
        this.log('Vital100s has been added');
    }


    async onSettings({oldSettings: {}, newSettings: {}, changedKeys: []}): Promise<string | void> {
        this.log('Vital100s settings where changed');
    }

    async onRenamed(name: string) {
        this.log('Vital100s was renamed');
    }

    async onDeleted() {
        this.log('Vital100s has been deleted');
    }

    async updateDevice(): Promise<void> {
        await super.updateDevice();
        if (this.device.status && this.getAvailable()) {
            this.setCapabilityValue('onoff', this.device.status.enabled).catch(this.error);
            if (this.hasCapability("vital100sCapability")) {
                if (this.device.status.mode === "manual")
                    this.setCapabilityValue('vital100sCapability', "manual").catch(this.error);
                if (this.device.status.mode === "sleep")
                    this.setCapabilityValue('vital100sCapability', "sleep").catch(this.error);
                if (this.device.status.mode === "auto")
                    this.setCapabilityValue('vital100sCapability', "auto").catch(this.error)
                if (this.device.status.mode === "pet")
                    this.setCapabilityValue('vital100sCapability', "pet").catch(this.error)
                if (!this.device.status.enabled)
                    this.setCapabilityValue('vital100sCapability', "off").catch(this.error);
            }

        }
        this.log("Updating device status!");
    }

}

module.exports = Vital100s;
