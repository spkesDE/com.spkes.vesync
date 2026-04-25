import BasicDevice from "./BasicDevice";
import IApiResponse from "../models/IApiResponse";
import {IGetTowerFanStatus} from "../models/towerfan/IGetTowerFanStatus";
import DeviceModes from "../enum/DeviceModes";

export default class BasicTowerFan extends BasicDevice {
    static levels: number[] = [];

    static hasLevel(level: number): boolean {
        return this.levels.includes(level);
    }

    status: IGetTowerFanStatus | null = null;

    public async getTowerFanStatus(): Promise<IApiResponse<IGetTowerFanStatus>> {
        const status = await this.post<any>('getTowerFanStatus', {});
        if (!status) throw new Error('Failed to get humidifier status');
        if (status.msg === 'request success') {
            this.status = this.normalizeTowerFanStatus(status.result?.result ?? {});
            return {
                ...status,
                result: {
                    ...status.result,
                    result: this.status
                }
            };
        }
        return status;
    }

    public async setDisplay(payload: boolean): Promise<IApiResponse<any>> {
        return await this.post('setDisplay', {
            screenSwitch: Number(payload)
        });
    }

    public async setDisplayingType(payload: 0 | 1): Promise<IApiResponse<any>> {
        return await this.post('setDisplayingType', {
            displayingType: payload
        });
    }

    public async setLevel(payload: number): Promise<IApiResponse<any>> {
        return await this.post('setLevel', {
            manualSpeedLevel: payload,
            levelIdx: 0,
            levelType: "wind"
        });
    }

    public async setMuteSwitch(payload: boolean): Promise<IApiResponse<any>> {
        return await this.post('setMuteSwitch', {
            muteSwitch: Number(payload)
        });
    }

    public async setOscillationSwitch(payload: boolean): Promise<IApiResponse<any>> {
        return await this.post('setOscillationSwitch', {
            oscillationSwitch: Number(payload)
        });
    }

    public async setSleepPreference(payload: {
        sleepPreferenceType: string,
        oscillationSwitch: boolean | 0 | 1,
        initFanSpeedLevel: number,
        fallAsleepRemain: boolean | 0 | 1,
        autoChangeFanLevelSwitch: boolean | 0 | 1
    }): Promise<IApiResponse<any>> {
        return await this.post('setSleepPreference', {
            sleepPreferenceType: payload.sleepPreferenceType,
            oscillationSwitch: Number(payload.oscillationSwitch),  // Convert to number if needed
            initFanSpeedLevel: payload.initFanSpeedLevel,
            fallAsleepRemain: Number(payload.fallAsleepRemain),
            autoChangeFanLevelSwitch: Number(payload.autoChangeFanLevelSwitch)
        });
    }

    public async setSwitch(payload: boolean): Promise<IApiResponse<any>> {
        return await this.post('setSwitch', {
            powerSwitch: Number(payload),
            switchIdx: 0
        });
    }

    public async setTowerFanMode(payload: DeviceModes): Promise<IApiResponse<any>> {
        return await this.post('setTowerFanMode', {
            workMode: payload
        });
    }

    protected normalizeTowerFanStatus(rawStatus: any): IGetTowerFanStatus {
        return {
            ...rawStatus,
            powerSwitch: this.numberValue(rawStatus.powerSwitch),
            workMode: rawStatus.workMode ?? DeviceModes.Normal,
            manualSpeedLevel: this.numberValue(rawStatus.manualSpeedLevel, rawStatus.fanSpeedLevel),
            fanSpeedLevel: this.numberValue(rawStatus.fanSpeedLevel, rawStatus.manualSpeedLevel),
            screenState: this.numberValue(rawStatus.screenState, rawStatus.screenSwitch),
            screenSwitch: this.numberValue(rawStatus.screenSwitch, rawStatus.screenState),
            oscillationSwitch: this.numberValue(rawStatus.oscillationSwitch, rawStatus.oscillationState),
            oscillationState: this.numberValue(rawStatus.oscillationState, rawStatus.oscillationSwitch),
            muteSwitch: this.numberValue(rawStatus.muteSwitch, rawStatus.muteState),
            muteState: this.numberValue(rawStatus.muteState, rawStatus.muteSwitch),
            timerRemain: this.numberValue(rawStatus.timerRemain),
            temperature: this.numberValue(rawStatus.temperature, rawStatus.tempInF),
            errorCode: this.numberValue(rawStatus.errorCode),
            sleepPreference: {
                sleepPreferenceType: rawStatus.sleepPreference?.sleepPreferenceType ?? rawStatus.sleepPreferenceType ?? "default",
                oscillationSwitch: this.numberValue(rawStatus.sleepPreference?.oscillationSwitch, rawStatus.oscillationSwitch),
                initFanSpeedLevel: this.numberValue(rawStatus.sleepPreference?.initFanSpeedLevel),
                fallAsleepRemain: this.numberValue(rawStatus.sleepPreference?.fallAsleepRemain),
                autoChangeFanLevelSwitch: this.numberValue(rawStatus.sleepPreference?.autoChangeFanLevelSwitch),
            },
            scheduleCount: this.numberValue(rawStatus.scheduleCount),
            displayingType: this.numberValue(rawStatus.displayingType),
        };
    }

}
