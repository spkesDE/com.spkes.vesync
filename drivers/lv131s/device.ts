import PurifierDeviceBase from "../../lib/PurifierDeviceBase";
import LV131Sdevice from "../../tsvesync/devices/purifier/LV131S";

class LV131S extends PurifierDeviceBase {
    device!: LV131Sdevice;
    private capabilitiesAddition: string[] = [
        "lv131sCapability",
        "onoff",
        "fanSpeed0to3",
        "sensor_air_quality",
        "measure_filter_life",
        "alarm_filter_life",
        "display_toggle"
    ]

    async onInit() {
        this.capabilitiesAddition.forEach((c) => this.checkForCapability(c));
        await super.onInit();
        this.registerCapabilityListener("onoff", async (value) => {
            if (!value) await this.setCapabilityValue("lv131sCapability", "off");
            await this.setMode(value ? "on" : "off");
            await this.updateDevice();
        });
        this.registerCapabilityListener("lv131sCapability", async (value) => {
            if (value === "off") await this.setCapabilityValue("onoff", false);
            else await this.setCapabilityValue("onoff", true);
            await this.setMode(value);
        });

        this.registerCapabilityListener("fanSpeed0to3", async (value) => {
            if (value === 0) await this.triggerCapabilityListener("onoff", false);
            else {
                await this.setCapabilityValue("onoff", true);
                await this.setCapabilityValue("lv131sCapability", "manual");
                await this.setMode("fan_speed_" + value);
            }
        })

        this.log('LV131S has been initialized');
    }

    async setMode(value: string) {
        if (!this.device.status) {
            this.error("LV131S is not connected");
            return;
        }
        await super.setMode(value);
    }

    async onAdded() {
        this.log('LV131S has been added');
    }

    async onSettings({oldSettings: {}, newSettings: {}, changedKeys: []}): Promise<string | void> {
        this.log('LV131S settings where changed');
    }

    async onRenamed(name: string) {
        this.log('LV131S was renamed');
    }

    async onDeleted() {
        this.log('LV131S has been deleted');
    }

    async updateDevice(): Promise<void> {
        await super.updateDevice();
        if (this.device.status && this.getAvailable()) {
            this.setCapabilityValue('onoff', this.device.status.mode != "off").catch(this.error);
            if (this.hasCapability("lv131sCapability")) {
                if (this.device.status.mode === "manual")
                    this.setCapabilityValue('lv131sCapability', "manual").catch(this.error);
                if (this.device.status.mode === "sleep")
                    this.setCapabilityValue('lv131sCapability', "sleep").catch(this.error);
                if (this.device.status.mode === "auto")
                    this.setCapabilityValue('lv131sCapability', "auto").catch(this.error)
                if (this.device.status.mode === "off")
                    this.setCapabilityValue('lv131sCapability', "off").catch(this.error);
            }
            if(this.hasCapability("sensor_air_quality")){
                this.setCapabilityValue("sensor_air_quality", this.device.status.airQuality).catch(this.error);
            }
        }
        this.log("Updating device status!");
    }


}

module.exports = LV131S;
