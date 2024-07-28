import BasicDevice from "./BasicDevice";
import IApiResponse from "../models/IApiResponse";
import ISetSwitchPayload from "../models/purifier/v2/ISetSwitchPayload";
import ISetChildLockPayload from "../models/purifier/v2/ISetChildLockPayload";
import ISetLevelPayload from "../models/purifier/v2/ISetLevelPayload";
import ISetPurifierModePayload from "../models/purifier/v2/ISetPurifierModePayload";
import ISetDisplayPayload from "../models/purifier/v2/ISetDisplayPayload";

export default class BasicPurifierV2 extends BasicDevice {
    static levels: number[] = [];

    static hasLevel(level: number): boolean {
        return this.levels.includes(level);
    }

    status: any | null = null;

    public async getPurifierStatus(): Promise<IApiResponse<any>> {
        const status =  await this.post<any>('getPurifierStatus', {});
        this.status = status.result.result;
        return status;
    }

    public async setSwitch(payload: ISetSwitchPayload): Promise<IApiResponse<any>> {
        return await this.post('setSwitch', payload);
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

    public async resetFilter(): Promise<IApiResponse<any>>
    {
        return await this.post('resetFilter', {});
    }
}
