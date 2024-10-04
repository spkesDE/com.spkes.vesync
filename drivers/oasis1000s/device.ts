import HumidifierDeviceBase from "../../lib/HumidifierDeviceBase";
import Oasis1000SDevice from "../../tsvesync/devices/humidifier/Oasis1000S";


class Oasis1000S extends HumidifierDeviceBase {
    device!: Oasis1000SDevice;
    private capabilitiesAddition: string[] = [
        "oasis1000sCapability",
        "onoff",
        "measure_humidity",
        "alarm_water_lacks",
        "fanSpeed0to9",
        "display_toggle"
    ]

    /**
     * onInit is called when the device is initialized.
     */
    async onInit() {
        this.capabilitiesAddition.forEach((c) => this.checkForCapability(c));
        await super.onInit();
        this.registerCapabilityListener("onoff", async (value) => {
            if (!value) await this.setCapabilityValue("oasis1000sCapability", "off");
            await this.setMode(value ? "on" : "off");
            await this.updateDevice();
        });
        this.registerCapabilityListener("oasis1000sCapability", async (value) => {
            if (value === "off") await this.setCapabilityValue("onoff", false);
            else await this.setCapabilityValue("onoff", true);
            await this.setMode(value);
        });

        this.registerCapabilityListener("fanSpeed0to9", async (value) => {
            if (value === 0) await this.triggerCapabilityListener("onoff", false);
            else {
                await this.setCapabilityValue("onoff", true);
                await this.setCapabilityValue("oasis1000sCapability", "manual");
                await this.setMode("fan_speed_" + value);
            }
        })
        this.log('Oasis1000S has been initialized');
    }

    async setMode(value: string) {
        if (!this.device.device) {
            this.error("Oasis1000S is not connected");
            return;
        }
        await super.setMode(value);
    }

    async updateDevice(): Promise<void> {
        await super.updateDevice();
        if (this.device.device && this.getAvailable()) {
            this.setCapabilityValue('onoff', this.device.status.enabled).catch(this.error);
            if (this.hasCapability("oasis1000sCapability")) {
                if (this.device.status.mode === "manual")
                    this.setCapabilityValue("oasis1000sCapability", "manual").catch(this.error);
                if (this.device.status.mode === "sleep")
                    this.setCapabilityValue('oasis1000sCapability', "sleep").catch(this.error);
                if (this.device.status.mode === "auto")
                    this.setCapabilityValue('oasis1000sCapability', "auto").catch(this.error);
                if (!this.device.status.enabled)
                    this.setCapabilityValue('oasis1000sCapability', "off").catch(this.error);
            }
        }
        this.log("Updating device status!");
    }

    async onAdded() {
        this.log('Oasis1000S has been added');
    }

    async onSettings(settings: { oldSettings: any, newSettings: any, changedKeys: string[] }): Promise<string | void> {
        await super.onSettings(settings);
        this.log('Oasis1000S settings where changed');
    }

    async onRenamed(name: string) {
        this.log('Oasis1000S was renamed');
    }

    async onDeleted() {
        this.log('Oasis1000S has been deleted');
    }

}

module.exports = Oasis1000S;
