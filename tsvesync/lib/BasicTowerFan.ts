import BasicDevice from "./BasicDevice";
import IApiResponse from "../models/IApiResponse";
import {IGetTowerFanStatus} from "../models/towerfan/IGetTowerFanStatus";
import ISetSwitchPayload from "../models/towerfan/ISetSwitchPayload";
import {ISetTowerFanModePayload} from "../models/towerfan/ISetTowerFanModePayload";
import {ISetSleepPreferencePayload} from "../models/towerfan/ISetSleepPreferencePayload";
import {ISetOscillationSwitchPayload} from "../models/towerfan/ISetOscillationSwitchPayload";
import {ISetMuteSwitchPayload} from "../models/towerfan/ISetMuteSwitchPayload";
import {ISetLevelPayload} from "../models/towerfan/ISetLevelPayload";
import ISetDisplayPayload from "../models/towerfan/ISetDisplayPayload";
import ISetDisplayTypePayload from "../models/towerfan/ISetDisplayTypePayload";

export default class BasicTowerFan extends BasicDevice {
    static levels: number[] = [];

    static hasLevel(level: number): boolean {
        return this.levels.includes(level);
    }

    status: IGetTowerFanStatus | null = null;

    public async getTowerFanStatus(): Promise<IApiResponse<IGetTowerFanStatus>> {
        const status = await this.post<IGetTowerFanStatus>('getTowerFanStatus', {});
        this.status = status.result.result;
        return status;
    }

    public async setDisplay(payload: ISetDisplayPayload): Promise<IApiResponse<any>> {
        return await this.post('setDisplay', payload);
    }

    public async setDisplayingType(payload: ISetDisplayTypePayload): Promise<IApiResponse<any>> {
        return await this.post('setDisplayingType', payload);
    }

    public async setLevel(payload: ISetLevelPayload): Promise<IApiResponse<any>> {
        return await this.post('setLevel', payload);
    }

    public async setMuteSwitch(payload: ISetMuteSwitchPayload): Promise<IApiResponse<any>> {
        return await this.post('setMuteSwitch', payload);
    }

    public async setOscillationSwitch(payload: ISetOscillationSwitchPayload): Promise<IApiResponse<any>> {
        return await this.post('setOscillationSwitch', payload);
    }

    public async setSleepPreference(payload: ISetSleepPreferencePayload): Promise<IApiResponse<any>> {
        return await this.post('setSleepPreference', payload);
    }

    public async setSwitch(payload: ISetSwitchPayload): Promise<IApiResponse<any>> {
        return await this.post('setSwitch', payload);
    }

    public async setTowerFanMode(payload: ISetTowerFanModePayload): Promise<IApiResponse<any>> {
        return await this.post('setTowerFanMode', payload);
    }


}