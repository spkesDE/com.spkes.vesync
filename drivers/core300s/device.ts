import PurifierDeviceBase from "../../lib/PurifierDeviceBase";

class Core300S extends PurifierDeviceBase {
    private capabilitiesAddition: string[] = [
        "measure_pm25",
        "alarm_pm25",
    ]

    async onInit() {
        await super.onInit();

        this.registerCapabilityListener("onoff", async (value) => {
            if (!value) this.setCapabilityValue("core300SCapability", "off").then();
            await this.setMode(value ? "on" : "off");
            await this.updateDevice();
        });
        this.registerCapabilityListener("core300SCapability", async (value) => {
            if (value === "off") this.setCapabilityValue("onoff", false).then();
            else this.setCapabilityValue("onoff", true).then();
            await this.setMode(value);
        });

        this.capabilitiesAddition.forEach((c) => this.checkForCapability(c));

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
        if (this.device.isConnected()) {
            this.setCapabilityValue('onoff', this.device.isOn()).catch(this.error);
            if (this.hasCapability("core300SCapability")) {
                if (this.device.mode === "manual")
                    this.setCapabilityValue('core300SCapability', "fan_speed_" + this.device.fan_level).catch(this.error);
                if (this.device.mode === "sleep")
                    this.setCapabilityValue('core300SCapability', "sleep").catch(this.error);
                if (this.device.mode === "auto")
                    this.setCapabilityValue('core300SCapability', "auto").catch(this.error)
                if (!this.device.isOn())
                    this.setCapabilityValue('core200sCapability', "off").catch(this.error);
            }
        }
        this.log("Updating device status!");
    }


}

module.exports = Core300S;
