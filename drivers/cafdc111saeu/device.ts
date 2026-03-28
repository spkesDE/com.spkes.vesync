import AirFryerDeviceBase from "../../lib/AirFryerDeviceBase";

class CAFDC111SAEUDevice extends AirFryerDeviceBase {
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
        this.log('CAFDC111SAEU has been initialized');
    }

    async onAdded() {
        this.log('CAFDC111SAEU has been added');
    }

    async onSettings({oldSettings: {}, newSettings: {}, changedKeys: []}): Promise<string | void> {
        this.log('CAFDC111SAEU settings where changed');
    }

    async onRenamed(name: string) {
        this.log('CAFDC111SAEU was renamed');
    }

    async onDeleted() {
        await super.onDeleted();
        this.log('CAFDC111SAEU has been deleted');
    }
}

module.exports = CAFDC111SAEUDevice;
