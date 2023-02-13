import HumidifierDeviceBase from "../../lib/HumidifierDeviceBase";

class Dual200s extends HumidifierDeviceBase {

    /**
     * onInit is called when the device is initialized.
     */
    async onInit() {
        await super.onInit();

        this.registerCapabilityListener("onoff", async (value) => {
            if (!value) this.setCapabilityValue("dual200sCapability", "off").then()
            //Restore old mode? Using then and trigger this.updateDevice()?
            await this.setMode(value ? "on" : "off")
        });
        this.registerCapabilityListener("dual200sCapability", async (value) => {
            if (value === "off") this.setCapabilityValue("onoff", false).then()
            else this.setCapabilityValue("onoff", true).then()
            await this.setMode(value)
        });

        this.log('Dual200s has been initialized');
    }


    async setMode(value: string) {
        if (!this.device.isConnected()) {
            this.error("Dual200S is not connected");
            return;
        }
    }

    async updateDevice(): Promise<void> {
        await super.updateDevice();
        if (this.device.isConnected()) {
            this.setCapabilityValue('onoff', this.device.isOn()).catch(this.error);
            if (this.hasCapability("dual200sCapability") && this.device.isOn()) {
                if (this.device.mode === "manual") {
                    this.setCapabilityValue('dual200sCapability', "fan_speed_" + this.device.mist_level).catch(this.error);
                } else if (this.device.mode === "sleep")
                    this.setCapabilityValue('dual200sCapability', "sleep").catch(this.error);
                else if (this.device.mode === "auto")
                    this.setCapabilityValue('dual200sCapability', "auto").catch(this.error);
            }
        }
        this.log("Updating device status!");
    }

    async onAdded() {
        this.log('Dual200s has been added');
    }

    async onSettings({oldSettings: {}, newSettings: {}, changedKeys: []}): Promise<string | void> {
        this.log('Dual200s settings where changed');
    }

    async onRenamed(name: string) {
        this.log('Dual200s was renamed');
    }

    async onDeleted() {
        this.log('Dual200s has been deleted');
    }

}

module.exports = Dual200s;
