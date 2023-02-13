import PurifierDeviceBase from "../../lib/PurifierDeviceBase";

class Core400s extends PurifierDeviceBase {

    async onInit() {
        await this.getDevice().catch(this.log);

        this.registerCapabilityListener("onoff", async (value) => {
            if (!value) this.setCapabilityValue("core400sCapability", "off").then();
            await this.setMode(value ? "on" : "off");
            await this.updateDevice();
        });
        this.registerCapabilityListener("core400sCapability", async (value) => {
            if (value === "off") this.setCapabilityValue("onoff", false).then();
            else this.setCapabilityValue("onoff", true).then();
            await this.setMode(value);
        });

        this.log('Core400s has been initialized');
    }

    async setMode(value: string) {
        if (!this.device.isConnected()) {
            this.error("Core400s is not connected");
            return;
        }
        await super.setMode(value);
    }

    async onAdded() {
        this.log('Core400s has been added');
    }


    async onSettings({oldSettings: {}, newSettings: {}, changedKeys: []}): Promise<string | void> {
        this.log('Core400s settings where changed');
    }

    async onRenamed(name: string) {
        this.log('Core400s was renamed');
    }

    async onDeleted() {
        this.log('Core400s has been deleted');
    }

    async updateDevice(): Promise<void> {
        await super.updateDevice();
        if (this.device.isConnected()) {
            this.setCapabilityValue('onoff', this.device.isOn()).catch(this.error);
            if (this.hasCapability("core400sCapability")) {
                if (this.device.mode === "manual")
                    this.setCapabilityValue('core400sCapability', "fan_speed_" + this.device.fan_level).catch(this.error);
                if (this.device.mode === "sleep")
                    this.setCapabilityValue('core400sCapability', "sleep").catch(this.error);
                if (this.device.mode === "auto")
                    this.setCapabilityValue('core400sCapability', "auto").catch(this.error)
                if (!this.device.isOn())
                    this.setCapabilityValue('core400sCapability', "off").catch(this.error);
            }

        }
        this.log("Updating device status!");
    }

}

module.exports = Core400s;
