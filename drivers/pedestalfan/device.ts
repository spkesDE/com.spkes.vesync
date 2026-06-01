import TowerFanDeviceBase from "../../lib/TowerFanDeviceBase";
import VeSyncPedestalFan from "../../tsvesync/devices/towerfan/PedestalFan";

class PedestalFan extends TowerFanDeviceBase {
    device!: VeSyncPedestalFan;
    private lastKnownChildLock: boolean | null = null;
    private lastKnownCalibrationProgress: number | null = null;
    private isSyncingOscillationSettings = false;

    private capabilitiesAddition: string[] = [
        "onoff",
        "display_toggle",
        "oscillation_toggle",
        "pedestalFanVerticalOscillation",
        "pedestalFanChildLock",
        "measure_pedestal_fan_oscillation_calibration_progress",
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

        this.registerCapabilityListener("pedestalFanVerticalOscillation", async (value) => {
            await this.device.setVerticalOscillationSwitch(value).catch(this.error);
            void this.updateDevice();
        });

        this.log('PedestalFan has been initialized');
    }

    async setMode(value: string) {
        await super.setMode(value);
    }

    async onAdded() {
        this.log('PedestalFan has been added');
    }

    async onSettings(settings: { oldSettings: any, newSettings: any, changedKeys: string[] }): Promise<string | void> {
        if (this.isSyncingOscillationSettings) {
            return;
        }

        const validationError = this.validateOscillationRangeSettings(settings.newSettings);
        if (validationError) {
            return validationError;
        }

        const changedKeys = settings.changedKeys;
        if (changedKeys.includes("horizontal_oscillation_left") || changedKeys.includes("horizontal_oscillation_right")) {
            await this.device.setHorizontalOscillationRange(
                Number(settings.newSettings.horizontal_oscillation_left),
                Number(settings.newSettings.horizontal_oscillation_right)
            );
        }
        if (changedKeys.includes("vertical_oscillation_top") || changedKeys.includes("vertical_oscillation_bottom")) {
            await this.device.setVerticalOscillationRange(
                Number(settings.newSettings.vertical_oscillation_top),
                Number(settings.newSettings.vertical_oscillation_bottom)
            );
        }
        void this.updateDevice();
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
            await this.setCapabilityIfPresent("pedestalFanVerticalOscillation", Boolean(this.device.status.verticalOscillationState));
            await this.setCapabilityIfPresent("pedestalFanChildLock", Boolean(this.device.status.childLock));
            await this.setCapabilityIfPresent(
                "measure_pedestal_fan_oscillation_calibration_progress",
                this.device.status.oscillationCalibrationProgress ?? 0
            );
            await this.syncOscillationRangeSettings();
            await this.triggerPedestalFanStatusFlows();
        }

        this.log("Updating device status!");
    }

    private validateOscillationRangeSettings(settings: any): string | null {
        const left = Number(settings.horizontal_oscillation_left);
        const right = Number(settings.horizontal_oscillation_right);
        const top = Number(settings.vertical_oscillation_top);
        const bottom = Number(settings.vertical_oscillation_bottom);

        if (!Number.isFinite(left) || !Number.isFinite(right) || left < 0 || right > 90 || left >= right) {
            return "Horizontal oscillation range must be 0-90 degrees and left must be lower than right.";
        }
        if (!Number.isFinite(top) || !Number.isFinite(bottom) || top < 0 || bottom > 120 || top >= bottom) {
            return "Vertical oscillation range must be 0-120 degrees and top must be lower than bottom.";
        }
        return null;
    }

    private async syncOscillationRangeSettings(): Promise<void> {
        const range = this.device.status?.oscillationRange;
        if (!range || !this.isValidOscillationRange(range)) {
            return;
        }

        const settingsToUpdate: Record<string, number> = {};
        if (Number(this.getSetting("horizontal_oscillation_left")) !== range.left) {
            settingsToUpdate.horizontal_oscillation_left = range.left;
        }
        if (Number(this.getSetting("horizontal_oscillation_right")) !== range.right) {
            settingsToUpdate.horizontal_oscillation_right = range.right;
        }
        if (Number(this.getSetting("vertical_oscillation_top")) !== range.top) {
            settingsToUpdate.vertical_oscillation_top = range.top;
        }
        if (Number(this.getSetting("vertical_oscillation_bottom")) !== range.bottom) {
            settingsToUpdate.vertical_oscillation_bottom = range.bottom;
        }

        if (Object.keys(settingsToUpdate).length === 0) {
            return;
        }

        try {
            this.isSyncingOscillationSettings = true;
            await this.setSettings(settingsToUpdate).catch(this.error);
        } finally {
            this.isSyncingOscillationSettings = false;
        }
    }

    private isValidOscillationRange(range: { left: number, right: number, top: number, bottom: number }): boolean {
        return Number.isFinite(range.left) &&
            Number.isFinite(range.right) &&
            Number.isFinite(range.top) &&
            Number.isFinite(range.bottom) &&
            range.left >= 0 &&
            range.right <= 90 &&
            range.left < range.right &&
            range.top >= 0 &&
            range.bottom <= 120 &&
            range.top < range.bottom;
    }

    private async triggerPedestalFanStatusFlows(): Promise<void> {
        const status = this.device.status;
        if (!status) {
            return;
        }

        const childLock = Boolean(status.childLock);
        const calibrationProgress = status.oscillationCalibrationProgress ?? 0;

        if (this.lastKnownChildLock !== null && this.lastKnownChildLock !== childLock) {
            await this.homey.flow.getDeviceTriggerCard("child_lock_changed").trigger(this, {
                child_lock: childLock,
            }).catch(this.error);
        }
        if (this.lastKnownCalibrationProgress !== null && this.lastKnownCalibrationProgress !== calibrationProgress) {
            await this.homey.flow.getDeviceTriggerCard("pedestal_fan_calibration_progress_changed").trigger(this, {
                progress: calibrationProgress,
                previous_progress: this.lastKnownCalibrationProgress,
            }).catch(this.error);
        }
        if (this.lastKnownCalibrationProgress !== null && this.lastKnownCalibrationProgress < 100 && calibrationProgress >= 100) {
            await this.homey.flow.getDeviceTriggerCard("pedestal_fan_calibration_completed").trigger(this).catch(this.error);
        }

        this.lastKnownChildLock = childLock;
        this.lastKnownCalibrationProgress = calibrationProgress;
    }

}

module.exports = PedestalFan;
