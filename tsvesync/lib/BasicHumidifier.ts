import BasicDevice from "./BasicDevice";
import IApiResponse from "../models/IApiResponse";
import DeviceModes from "../enum/DeviceModes";
import IGetHumidifierStatus from "../models/humidifier/IGetHumidifierStatus";

export default class BasicHumidifier<TStatus = IGetHumidifierStatus> extends BasicDevice {
    static warm_levels: number[] | null = null;
    static levels: number[] = [];

    static hasLevel(level: number): boolean {
        return this.levels.includes(level);
    }

    static hasWarmLevel(level: number): boolean {
        if (this.warm_levels) {
            return this.warm_levels.includes(level);
        }
        return false;
    }

    status: TStatus | null = null;

    public async getHumidifierStatus(): Promise<IApiResponse<TStatus>> {
        const status = await this.post<TStatus>('getHumidifierStatus', {});
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
        if (!this.hasLevel(payload)) return Promise.reject(new Error('Invalid level'));
        return await this.post('setVirtualLevel', {
            level: payload,
            id: 0,
            type: 'mist'
        });
    }

    public async setHumidityMode(payload: DeviceModes): Promise<IApiResponse<any>> {
        return await this.post('setHumidityMode', {
            mode: payload
        });
    }

    public async setTargetHumidity(payload: number): Promise<IApiResponse<any>> {
        if (payload < 0 || payload > 100) return Promise.reject(new Error('Humidity must be between 0 and 100'));
        return await this.post('setTargetHumidity', {
            target_humidity: payload
        });
    }

    public async setAutomaticStop(payload: boolean): Promise<IApiResponse<any>> {
        return await this.post('setAutomaticStop', {
            enabled: Number(payload)
        });
    }

    public async setDisplay(payload: boolean): Promise<IApiResponse<any>> {
        return await this.post('setDisplay', {
            state: Number(payload)
        });
    }

    public async setNightLightBrightness(payload: number): Promise<IApiResponse<any>> {
        if (payload < 0 || payload > 100) return Promise.reject(new Error('Brightness must be between 0 and 100'));
        return await this.post('setNightLightBrightness', {
            brightness: payload
        });
    }

    public async setChildLock(payload: boolean): Promise<IApiResponse<any>> {
        return await this.post('setChildLock', {
            child_lock: Number(payload)
        });
    }

    protected hasLevel(level: number): boolean {
        const methods = (this.constructor as typeof BasicHumidifier).levels;
        return methods.includes(level);
    }
}