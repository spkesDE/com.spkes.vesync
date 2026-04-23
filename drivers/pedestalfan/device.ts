
import TowerFanDeviceBase from "../../lib/TowerFanDeviceBase";

class PedestalFan extends TowerFanDeviceBase {

    private capabilitiesAddition: string[] = [
        "onoff",
        "display_toggle",
        "oscillation_toggle",
        "pedestalFanCapability",
        'measure_temperature',
        'fanSpeed0to12',
        "mute_toggle",
    ]

    async onInit() {
        this.capabilitiesAddition.forEach((c) => this.checkForCapability(c));
        await super.onInit();

        this.registerCapabilityListener("pedestalFanCapability", async (value) => {
            if (value === "off") await this.setCapabilityValue("onoff", false);
            else await this.setCapabilityValue("onoff", true);
            await this.setMode(value);
        });

        // fanSpeed0to12
        this.registerCapabilityListener("fanSpeed0to12", async (value) => {
            // Set to normal mode if not already
            if(this.getCapabilityValue("pedestalFanCapability") !== "normal") {
                await this.setCapabilityValue("pedestalFanCapability", "normal");
            }
            await this.setMode("fan_speed_" + value);
        });


        this.log('PedestalFan has been initialized');
    }

    async setMode(value: string) {
        await super.setMode(value);
    }

    async onAdded() {
        this.log('PedestalFan has been added');
    }

    async onSettings({oldSettings: {}, newSettings: {}, changedKeys: []}): Promise<string | void> {
        this.log('PedestalFan settings where changed');
    }

    async onRenamed(name: string) {
        this.log('PedestalFan was renamed');
    }

    async onDeleted() {
        await super.onDeleted();
        this.log('PedestalFan has been deleted');
    }

    async updateDevice(){
        await super.updateDevice();

        if(this.device.status) {
            if(this.hasCapability("pedestalFanCapability")) {
                if (!this.device.status.powerSwitch) {
                    await this.setCapabilityValue("pedestalFanCapability", "off");
                } else {
                    await this.setCapabilityValue("pedestalFanCapability", this.device.status.workMode);
                }
            }
        }

        this.log("Updating device status!");
    }


}

module.exports = PedestalFan;
