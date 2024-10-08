import DeviceModes from "../../enum/DeviceModes";
import IApiResponse from "../../models/IApiResponse";
import BasicPurifier from "../../lib/BasicPurifier";
import {IGetVitalPurifierStatus} from "../../models/purifier/IGetVitalPurifierStatus";


export default class Vital200S extends BasicPurifier {
    static deviceModels = ['LAP-V201S-AASR', 'LAP-V201S-WJP', 'LAP-V201S-WEU',
        'LAP-V201S-WUS', 'LAP-V201-AUSR', 'LAP-V201S-AEUR'];
    static methods = ['getPurifierStatus', 'setSwitch', 'setLevel', 'setLightDetection', 'setChildLock', 'setDisplay', 'setAutoPreference', 'setPurifierMode'];
    static modes = [DeviceModes.Auto, DeviceModes.Manual, DeviceModes.Sleep, DeviceModes.Pet, DeviceModes.Off];
    static levels = [1, 2, 3, 4];
    static features = ['air_quality'];

    public async getPurifierStatus(): Promise<IApiResponse<any>> {
        const status = await this.post<IGetVitalPurifierStatus>('getPurifierStatus', {});
        if (status.msg !== 'request success') return status;
        /* Raw Result:  {
          powerSwitch: 1,
          filterLifePercent: 70,
          workMode: 'auto',
          manualSpeedLevel: 3,
          fanSpeedLevel: 0,
          AQLevel: 1,
          PM25: 1,
          screenState: 0,
          childLockSwitch: 0,
          screenSwitch: 1,
          lightDetectionSwitch: 1,
          environmentLightState: 1,
          autoPreference: { autoPreferenceType: 'default', roomSize: 0 },
          scheduleCount: 0,
          timerRemain: 0,
          efficientModeTimeRemain: 0,
          sleepPreference: {
            sleepPreferenceType: 'custom',
            cleaningBeforeBedSwitch: 1,
            cleaningBeforeBedSpeedLevel: 3,
            cleaningBeforeBedMinutes: 5,
            whiteNoiseSleepAidSwitch: 0,
            whiteNoiseSleepAidSpeedLevel: 1,
            whiteNoiseSleepAidMinutes: 45,
            duringSleepSpeedLevel: 5,
            duringSleepMinutes: 480,
            afterWakeUpPowerSwitch: 1,
            afterWakeUpWorkMode: 'auto',
            afterWakeUpFanSpeedLevel: 1
          },
          errorCode: 0
        } */
        // Convert the status to the correct format
        this.status = {
            air_quality: this.mapPMToQuality(status.result.result.PM25),
            air_quality_value: status.result.result.PM25,
            buzzer: false,
            child_lock: status.result.result.childLockSwitch === 1,
            configuration: undefined,
            device_error_code: 0,
            display: status.result.result.screenSwitch === 1,
            enabled: status.result.result.powerSwitch === 1,
            extension: undefined,
            filter_life: status.result.result.filterLifePercent,
            level: status.result.result.fanSpeedLevel,
            mode: status.result.result.workMode,
            night_light: "off",
            plasma: false,
            replace_filter: status.result.result.filterLifePercent <= 10,
        };

        return {
            ...status,
            result: {
                traceId: status.result.traceId,
                code: status.result.code,
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
        if (!Vital200S.levels.includes(payload)) {
            throw new Error(`Invalid level: ${payload}`);
        }
        return await this.post('setLevel', {
            levelIdx: 0,
            manualSpeedLevel: payload,
            levelType: "wind"
        });
    }

    public async setPurifierMode(mode: DeviceModes): Promise<IApiResponse<any>> {
        if (!Vital200S.modes.includes(mode)) {
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