import IApiResponse from "../models/IApiResponse";
import IGetPurifierStatus from "../models/purifier/IGetPurifierStatus";
import ISetSwitchPayload from "../models/purifier/ISetSwitchPayload";
import ISetNightLightPayload from "../models/purifier/ISetNightLightPayload";
import ISetLevelPayload from "../models/purifier/ISetLevelPayload";
import ISetPurifierModePayload from "../models/purifier/ISetPurifierModePayload";
import ISetDisplayPayload from "../models/purifier/ISetDisplayPayload";
import ISetChildLockPayload from "../models/purifier/ISetChildLockPayload";
import ISetIndicatorLightPayload from "../models/purifier/ISetIndicatorLightPayload";
import BasicDevice from "./BasicDevice";

export default class BasicPurifier extends BasicDevice {
    static levels: number[] = [];

    static hasLevel(level: number): boolean {
        return this.levels.includes(level);
    }

    status: IGetPurifierStatus | any | null = null;

    public async getPurifierStatus(): Promise<IApiResponse<any>> {
        const status =  await this.post<any>('getPurifierStatus', {});
        this.status = status.result.result;
        return status;
    }

    public async setSwitch(payload: ISetSwitchPayload): Promise<IApiResponse<any>> {
        return await this.post('setSwitch', payload);
    }

    public async setNightLight(payload: ISetNightLightPayload): Promise<IApiResponse<any>> {
        return await this.post('setNightLight', payload);
    }

    public async setLevel(payload: ISetLevelPayload): Promise<IApiResponse<any>> {
        return await this.post('setLevel', payload);
    }

    public async setPurifierMode(mode: ISetPurifierModePayload): Promise<IApiResponse<any>> {
        return await this.post('setPurifierMode', mode);
    }

    public async setDisplay(payload: ISetDisplayPayload): Promise<IApiResponse<any>> {
        return await this.post('setDisplay', payload);
    }

    public async setChildLock(payload: ISetChildLockPayload): Promise<IApiResponse<any>> {
        return await this.post('setChildLock', payload);
    }

    public async setIndicatorLight(payload: ISetIndicatorLightPayload): Promise<IApiResponse<any>> {
        return await this.post('setIndicatorLight', payload);
    }
}
