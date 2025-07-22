import DeviceModes from "../../enum/DeviceModes";
import BasicPurifier from "../../lib/BasicPurifier";
import IApiResponse from "../../models/IApiResponse";

export default class EverestAir extends BasicPurifier {
    static deviceModels = ['LAP-EL551S-AUS', 'LAP-EL551S-AEUR', 'LAP-EL551S-WEU', 'LAP-EL551S-WUS'];
    static methods = ['getPurifierStatus', 'setSwitch', 'setLevel', 'setLightDetection', 'setChildLock', 'setDisplay', 'setAutoPreference', 'setPurifierMode'];
    static modes = [DeviceModes.Auto, DeviceModes.Manual, DeviceModes.Sleep, DeviceModes.Turbo, DeviceModes.Off];
    static levels = [1, 2, 3, 4];
    static features = ['air_quality', 'fan_rotate'];


    public async getPurifierStatus(): Promise<IApiResponse<any>> {
        const status = await this.post<any>('getPurifierStatus', {});
        /**
         * fanRotateAngle: 75,
         *       filterOpenState: 0,
         *       powerSwitch: 1,
         *       filterLifePercent: 53,
         *       workMode: 'manual',
         *       manualSpeedLevel: 2,
         *       fanSpeedLevel: 2,
         *       AQLevel: 1,
         *       AQPercent: 99,
         *       PM25: 2,
         *       PM1: 1,
         *       PM10: 3,
         *       screenState: 1,
         *       childLockSwitch: 0,
         *       screenSwitch: 1,
         *       lightDetectionSwitch: 1,
         *       environmentLightState: 0,
         *       autoPreference: [Object],
         *       routine: [Object],
         *       scheduleCount: 0,
         *       timerRemain: 0,
         *       efficientModeTimeRemain: 0,
         *       ecoModeRunTime: 0,
         *       errorCode: 0
         */
        // Convert the status to the correct format
        this.status = {
            air_quality: this.mapPMToQuality(status.result.result.PM25),
            air_quality_value: status.result.result.PM25,
            buzzer: false,
            child_lock: status.result.result.childLockSwitch === 1,
            configuration: undefined,
            device_error_code: status.result.result.errorCode,
            display: status.result.result.screenSwitch === 1,
            enabled: status.result.result.powerSwitch === 1,
            level: status.result.result.fanSpeedLevel,
            filter_life: status.result.result.filterLifePercent,
            night_light: "off", // This device does not have a night light feature
            mode: status.result.result.workMode as DeviceModes,
            replace_filter: status.result.result.filterLifePercent < 20,
            fanRotateAngle: status.result.result.fanRotateAngle,
            AQLevel: status.result.result.AQLevel,
            AQPercent: status.result.result.AQPercent,
            PM1: status.result.result.PM1,
            PM10: status.result.result.PM10,
            PM25: status.result.result.PM25,
        };

        return {
            ...status,
            result: {
                traceId: status.result.result.traceId,
                code: status.result.result.code,
                result: this.status
            }
        }
    }

    private mapPMToQuality(pmValue: number): string {
        if (pmValue === 0) {
            return 'excellent';
        } else if (pmValue <= 12) {
            return 'good';
        } else if (pmValue <= 35) {
            return 'moderate';
        } else if (pmValue <= 55) {
            return 'poor';
        } else {
            return 'very poor';
        }
    }

    public async setSwitch(payload: boolean): Promise<IApiResponse<any>> {
        return await this.post('setSwitch', {
            powerSwitch: Number(payload),
            switchIdx: 0
        });
    }

    public async setLevel(payload: number): Promise<IApiResponse<any>> {
        if (!EverestAir.levels.includes(payload)) {
            throw new Error(`Invalid level: ${payload}`);
        }
        return await this.post('setLevel', {
            levelIdx: 0,
            manualSpeedLevel: payload,
            levelType: "wind"
        });
    }

    public async setPurifierMode(mode: DeviceModes): Promise<IApiResponse<any>> {
        if (!EverestAir.modes.includes(mode)) {
            throw new Error(`Invalid mode: ${mode}`);
        }
        return await this.post('setPurifierMode', {
            workMode: mode
        });
    }

    public async setDisplay(payload: boolean): Promise<IApiResponse<any>> {
        return await this.post('setDisplay', {
            screenSwitch: Number(payload)
        });
    }

    public async setChildLock(payload: boolean): Promise<IApiResponse<any>> {
        return await this.post('setChildLock', {
            childLockSwitch: Number(payload),
        });
    }

    public async resetFilter(): Promise<IApiResponse<any>> {
        return await this.post('resetFilter', {});
    }
}