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
        const status = await this.post<IGetTowerFanStatus>('getTowerFanStatus', {});
        if (!status) throw new Error('Failed to get humidifier status');
        this.status = status.result.result;
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
}