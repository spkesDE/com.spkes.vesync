import AirFryerDeviceBase from "../../lib/AirFryerDeviceBase";

class CAFP583SDevice extends AirFryerDeviceBase {
    private capabilitiesAddition: string[] = [
        "onoff",
        "airfryerProgram",
        "measure_airfryer_remaining_time",
        "airfryerCookStatus",
        "measure_airfryer_hold_time",
        "measure_airfryer_cook_set_time",
        "target_temperature",
        "measure_temperature",
        "measure_airfryer_current_remaining_time"
    ]

    async onInit() {
        for (const capability of this.capabilitiesAddition) {
            await this.checkForCapability(capability);
        }
        await super.onInit();
        this.log('CAFP583S Dual Blaze has been initialized');
    }

    async onAdded() {
        this.log('CAFP583S Dual Blaze has been added');
    }

    async onSettings({oldSettings: {}, newSettings: {}, changedKeys: []}): Promise<string | void> {
        this.log('CAFP583S Dual Blaze settings where changed');
    }

    async onRenamed(name: string) {
        this.log('CAFP583S Dual Blaze was renamed');
    }

    async onDeleted() {
        await super.onDeleted();
        this.log('CAFP583S Dual Blaze has been deleted');
    }
}

module.exports = CAFP583SDevice;
