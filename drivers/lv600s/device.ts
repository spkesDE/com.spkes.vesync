import HumidifierDeviceBase from "../../lib/HumidifierDeviceBase";

class LV600S extends HumidifierDeviceBase {
    /**
     * onInit is called when the device is initialized.
     */
    async onInit() {
        await super.onInit();

        this.registerCapabilityListener("onoff", async (value) => {
            if (!value) this.setCapabilityValue("lv600sCapability", "off").then();
            await this.setMode(value ? "on" : "off");
            await this.updateDevice();
        });
        this.registerCapabilityListener("lv600sCapability", async (value) => {
            if (value === "off") this.setCapabilityValue("onoff", false).then();
            else this.setCapabilityValue("onoff", true).then();
            await this.setMode(value);
        });
        this.registerCapabilityListener("lv600sWarmCapability", async (value) => {
            if (value === "off") this.setCapabilityValue("onoff", false).then();
            else this.setCapabilityValue("onoff", true).then();
            await this.setMode(value);
        });


        this.log('LV600S has been initialized');
    }

    async onAdded() {
        this.log('LV600S has been added');
    }

    async onSettings({oldSettings: {}, newSettings: {}, changedKeys: []}): Promise<string | void> {
        this.log('LV600S settings where changed');
    }

    async onRenamed(name: string) {
        this.log('LV600S was renamed');
    }

    async onDeleted() {
        this.log('LV600S has been deleted');
    }

    async setMode(value: string) {
        if (!this.device.isConnected()) {
            this.error("LV600S is not connected");
            return;
        }
        this.log("Mode: " + value);
        await super.setMode(value);
    }

    async updateDevice(): Promise<void> {
        await super.updateDevice();
        if (this.device.isConnected()) {
            this.setCapabilityValue('onoff', this.device.isOn()).catch(this.error);
            if (this.hasCapability("lv600sCapability")) {
                if (this.device.mode === "manual")
                    this.setCapabilityValue('lv600sCapability', "fan_speed_" + this.device.mist_level).catch(this.error);
                if (this.device.mode === "sleep")
                    this.setCapabilityValue('lv600sCapability', "sleep").catch(this.error);
                if (this.device.mode === "auto")
                    this.setCapabilityValue('lv600sCapability', "auto").catch(this.error);
                if (!this.device.isOn())
                    this.setCapabilityValue('lv600sCapability', "off").catch(this.error);
            }
            if (this.hasCapability("lv600sWarmCapability") && this.device.isOn()) {
                this.setCapabilityValue('lv600sWarmCapability', "warm_fan_speed_" + this.device.warm_mist_level).catch(this.error);
            }
        }
        this.log("Updating device status!");
    }


}

module.exports = LV600S;
