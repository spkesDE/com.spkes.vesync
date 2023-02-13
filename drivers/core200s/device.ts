import PurifierDeviceBase from "../../lib/PurifierDeviceBase";

class Core200S extends PurifierDeviceBase {

    async onInit() {
        await super.onInit();

        this.registerCapabilityListener("onoff", async (value) => {
            if (!value) this.setCapabilityValue("core200sCapability", "off").then()
            //Restore old mode? Using then and trigger this.updateDevice()?
            await this.setMode(value ? "on" : "off")
        });
        this.registerCapabilityListener("core200sCapability", async (value) => {
            if (value === "off") this.setCapabilityValue("onoff", false).then()
            else this.setCapabilityValue("onoff", true).then()
            await this.setMode(value)
        });


        if (!this.hasCapability("measure_filter_life"))
            await this.addCapability("measure_filter_life");
        if (!this.hasCapability("alarm_filter_life"))
            await this.addCapability("alarm_filter_life");

        this.log('Core200S has been initialized');
    }

    async setMode(mode: string) {
        if (!this.device.isConnected()) {
            this.error("Core200S is not connected");
            return;
        }
        await super.setMode(mode);
    }

    async updateDevice(): Promise<void> {
        await super.updateDevice().catch(this.error);
        if (this.device.isConnected()) {
            this.setCapabilityValue('onoff', this.device.isOn()).catch(this.error);
            if (this.hasCapability("core200sCapability") && this.device.isOn()) {
                if (this.device.mode === "manual") {
                    this.setCapabilityValue('core200sCapability', "fan_speed_" + this.device.fan_level).catch(this.error);
                } else if (this.device.mode === "sleep")
                    this.setCapabilityValue('core200sCapability', "sleep").catch(this.error);
            }
        }
        this.log("Updating device status!");
    }

    async onAdded() {
        this.log('Core200S has been added');
    }

    async onSettings({oldSettings: {}, newSettings: {}, changedKeys: []}): Promise<string | void> {
        this.log('Core200S settings where changed');
    }

    async onRenamed(name: string) {
        this.log('Core200S was renamed');
    }

}

module.exports = Core200S;
