import IApiResponse from "../models/IApiResponse";
import IGetPurifierStatus from "../models/purifier/IGetPurifierStatus";
import BasicDevice from "./BasicDevice";
import DeviceModes from "../enum/DeviceModes";

export default class BasicPurifier extends BasicDevice {
    static levels: number[] = [];

    static hasLevel(level: number): boolean {
        return this.levels.includes(level);
    }

    status: IGetPurifierStatus | null = null;

    // Methods shared across all purifiers, leave some abstract if specific devices need custom implementations
    public async getPurifierStatus(): Promise<IApiResponse<IGetPurifierStatus>> {
        const status = await this.post<IGetPurifierStatus>('getPurifierStatus', {});
        if (!status) throw new Error('Failed to get humidifier status');
        if (status.msg === 'request success') this.status = status.result.result;
        return status;
    }

    public async setSwitch(payload: boolean): Promise<IApiResponse<any>> {
        return await this.post('setSwitch', {
            enabled: payload,
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
            state: payload
        });
    }

    public async setChildLock(payload: boolean): Promise<IApiResponse<any>> {
        return await this.post('setChildLock', {
            child_lock: payload
        });
    }

    // 'setNightLight', {night_light: mode.toLowerCase()}
    public async setNightLight(payload: string): Promise<IApiResponse<any>> {
        // Allowed on, off, dim
        if (!['on', 'off', 'dim'].includes(payload.toLowerCase())) return Promise.reject('Invalid night light mode');
        return await this.post('setNightLight', {
            night_light: payload.toLowerCase()
        });
    }
}
