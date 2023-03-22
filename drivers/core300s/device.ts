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
        await this.capabilitiesAddition.forEach((c) => this.checkForCapability(c));
        await super.onInit();

        this.registerCapabilityListener("onoff", async (value) => {
            if (!value) this.setCapabilityValue("core300sCapability", "off").then();
            await this.setMode(value ? "on" : "off");
            await this.updateDevice();
        });
        this.registerCapabilityListener("core300sCapability", async (value) => {
            if (value === "off") this.setCapabilityValue("onoff", false).then();
            else this.setCapabilityValue("onoff", true).then();
            await this.setMode(value);
        });

        this.registerCapabilityListener("fanSpeed0to5", async (value) => {
            if (value === 0) this.triggerCapabilityListener("onoff", false).then();
            else {
                this.setCapabilityValue("onoff", true).then();
                this.setCapabilityValue("core300sCapability", "manual").then();
                await this.setMode("fan_speed_" + value);
            }
        })

        this.log('Core300S has been initialized');
    }

    async setMode(value: string) {
        if (!this.device.isConnected()) {
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
        if (this.device.isConnected() && this.getAvailable()) {
            this.setCapabilityValue('onoff', this.device.isOn()).catch(this.error);
            if (this.hasCapability("core300sCapability")) {
                if (this.device.mode === "manual")
                    this.setCapabilityValue('core300sCapability', "manual").catch(this.error);
                if (this.device.mode === "sleep")
                    this.setCapabilityValue('core300sCapability', "sleep").catch(this.error);
                if (this.device.mode === "auto")
                    this.setCapabilityValue('core300sCapability', "auto").catch(this.error)
                if (!this.device.isOn())
                    this.setCapabilityValue('core300sCapability', "off").catch(this.error);
            }
        }
        this.log("Updating device status!");
    }


}

module.exports = Core300S;
