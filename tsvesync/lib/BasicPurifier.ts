import IApiResponse from "../models/IApiResponse";
import IGetPurifierStatus from "../models/purifier/IGetPurifierStatus";
import BasicDevice from "./BasicDevice";
import DeviceModes from "../enum/DeviceModes";

export default class BasicPurifier extends BasicDevice {
    static levels: number[] = [];

    static hasLevel(level: number): boolean {
        return this.levels.includes(level);
    }

    status: IGetPurifierStatus | any | null = null;

    // Methods shared across all purifiers, leave some abstract if specific devices need custom implementations
    public async getPurifierStatus(): Promise<IApiResponse<any>> {
        const status = await this.post<any>('getPurifierStatus', {});
        this.status = status.result.result;
        return status;
    }

    public async setSwitch(payload: boolean): Promise<IApiResponse<any>> {
        return await this.post('setSwitch', {
            enabled: Number(payload),
            id: 0
        });
    }

    public async setLevel(payload: number): Promise<IApiResponse<any>> {
        return await this.post('setLevel', {
            level: payload,
            id: 0,
            type: 'wind'
        });
    }

    public async setPurifierMode(payload: DeviceModes): Promise<IApiResponse<any>> {
        return await this.post('setPurifierMode', {
            mode: payload
        });
    }

    public async setDisplay(payload: boolean): Promise<IApiResponse<any>> {
        return await this.post('setDisplay', {
            status: Number(payload)
        });
    }

    public async setChildLock(payload: boolean): Promise<IApiResponse<any>> {
        return await this.post('setChildLock', {
            child_lock: Number(payload)
        });
    }
}
