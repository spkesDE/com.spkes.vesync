import HumidifierDeviceBase from "../../lib/HumidifierDeviceBase";


class Classic300s extends HumidifierDeviceBase {

    /**
     * onInit is called when the device is initialized.
     */
    async onInit() {
        await super.onInit();
        this.registerCapabilityListener("onoff", async (value) => {
            if (!value) this.setCapabilityValue("classic300sCapability", "off").then()
            //Restore old mode? Using then and trigger this.updateDevice()?
            await this.setMode(value ? "on" : "off")
        });
        this.registerCapabilityListener("classic300sCapability", async (value) => {
            if (value === "off") this.setCapabilityValue("onoff", false).then()
            else this.setCapabilityValue("onoff", true).then()
            await this.setMode(value)
        });
        this.log('Classic300s has been initialized');
    }


    async setMode(value: string) {
        if (!this.device.isConnected()) {
            this.error("Classic300s is not connected");
            return;
        }
        await super.setMode(value);
        this.log(value);
    }

    async updateDevice(): Promise<void> {
        await super.updateDevice();
        if (this.device.isConnected()) {
            this.setCapabilityValue('onoff', this.device.isOn()).catch(this.error);
            if (this.hasCapability("classic300sCapability") && this.device.isOn()) {
                if (this.device.mode === "manual") {
                    this.setCapabilityValue('classic300sCapability', "fan_speed_" + this.device.mist_level).catch(this.error);
                } else if (this.device.mode === "sleep")
                    this.setCapabilityValue('classic300sCapability', "sleep").catch(this.error);
                else if (this.device.mode === "auto")
                    this.setCapabilityValue('classic300sCapability', "auto").catch(this.error);
            }
        }
        this.log("Updating device status!");
    }

    async onAdded() {
        this.log('Classic300s has been added');
    }

    async onSettings({oldSettings: {}, newSettings: {}, changedKeys: []}): Promise<string | void> {
        this.log('Classic300s settings where changed');
    }

    async onRenamed(name: string) {
        this.log('Classic300s was renamed');
    }

    async onDeleted() {
        this.log('Classic300s has been deleted');
    }

}

module.exports = Classic300s;
