
import TowerFanDeviceBase from "../../lib/TowerFanDeviceBase";

class F422S extends TowerFanDeviceBase {

    private capabilitiesAddition: string[] = [
        "onoff",
        "display_toggle",
        "oscillation_toggle",
        "f422sCapability",
        'measure_temperature',
        'fanSpeed0to12',
        "mute_toggle",
    ]

    async onInit() {
        this.capabilitiesAddition.forEach((c) => this.checkForCapability(c));
        await super.onInit();

        // f422sCapability handler
        this.registerCapabilityListener("f422sCapability", async (value) => {
            if (value === "off") await this.setCapabilityValue("onoff", false);
            else await this.setCapabilityValue("onoff", true);
            await this.setMode(value);
        });

        // fanSpeed0to12
        this.registerCapabilityListener("fanSpeed0to12", async (value) => {
            // Set to normal mode if not already
            if(this.getCapabilityValue("f422sCapability") !== "normal") {
                await this.setCapabilityValue("f422sCapability", "normal");
            }
            await this.setMode("fan_speed_" + value);
        });


        this.log('F422S has been initialized');
    }

    async setMode(value: string) {
        if (!this.device.isConnected()) {
            this.error("F422S is not connected");
            return;
        }
        await super.setMode(value);
    }

    async onAdded() {
        this.log('F422S has been added');
    }

    async onSettings({oldSettings: {}, newSettings: {}, changedKeys: []}): Promise<string | void> {
        this.log('F422S settings where changed');
    }

    async onRenamed(name: string) {
        this.log('F422S was renamed');
    }

    async onDeleted() {
        this.log('F422S has been deleted');
    }

    async updateDevice(): Promise<void> {
        await super.updateDevice();

        // f422sCapability
        if(this.device.isConnected()) {
            if(this.hasCapability("f422sCapability")) {
                await this.setCapabilityValue("f422sCapability", this.device.mode);
            }
        }

        this.log("Updating device status!");
    }


}

module.exports = F422S;
