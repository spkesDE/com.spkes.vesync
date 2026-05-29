import BasicDevice from "./BasicDevice";
import IApiResponse from "../models/IApiResponse";
import DeviceModes from "../enum/DeviceModes";
import IGetHumidifierStatus from "../models/humidifier/IGetHumidifierStatus";

export default class BasicHumidifier extends BasicDevice {
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

    status: IGetHumidifierStatus | null = null;

    public async getHumidifierStatus(): Promise<IApiResponse<IGetHumidifierStatus>> {
        const status = await this.post<any>('getHumidifierStatus', {});
        if (!status) throw new Error('Failed to get humidifier status');
        if (status.msg === 'request success') {
            this.status = this.normalizeHumidifierStatus(status.result?.result ?? {});
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

    public async setSwitch(payload: boolean): Promise<IApiResponse<any>> {
        return await this.post('setSwitch', {
            enabled: payload,
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
            enabled: payload
        });
    }

    public async setDisplay(payload: boolean): Promise<IApiResponse<any>> {
        return await this.post('setDisplay', {
            state: payload
        });
    }

    public async setNightLightBrightness(payload: number): Promise<IApiResponse<any>> {
        if (payload < 0 || payload > 100) return Promise.reject(new Error('Brightness must be between 0 and 100'));
        return await this.post('setNightLightBrightness', {
            brightness: payload
        });
    }


    protected hasLevel(level: number): boolean {
        const methods = (this.constructor as typeof BasicHumidifier).levels;
        return methods.includes(level);
    }

    protected normalizeHumidifierStatus(rawStatus: any): IGetHumidifierStatus {
        const configuration = rawStatus?.configuration ?? {};
        const targetHumidity = this.numberValue(
            configuration.auto_target_humidity,
            rawStatus.auto_target_humidity,
            rawStatus.targetHumidity,
            rawStatus.target_humidity
        );

        return {
            ...rawStatus,
            humidity: this.numberValue(rawStatus.humidity),
            enabled: this.booleanValue(rawStatus.enabled, rawStatus.powerSwitch, rawStatus.deviceStatus),
            mode: rawStatus.mode ?? rawStatus.workMode ?? DeviceModes.Manual,
            mist_level: this.numberValue(rawStatus.mist_level, rawStatus.mistLevel, rawStatus.level),
            virtual_mist_level: this.numberValue(rawStatus.virtual_mist_level, rawStatus.virtualLevel, rawStatus.mist_level, rawStatus.mistLevel),
            warm_mist_enabled: this.booleanValue(rawStatus.warm_mist_enabled, rawStatus.warmPower),
            warm_mist_level: this.numberValue(rawStatus.warm_mist_level, rawStatus.warmLevel),
            water_lacks: this.booleanValue(rawStatus.water_lacks, rawStatus.waterLacksState),
            humidity_high: this.booleanValue(rawStatus.humidity_high),
            water_tank_lifted: this.booleanValue(rawStatus.water_tank_lifted, rawStatus.waterTankLifted),
            automatic_stop_reach_target: this.booleanValue(rawStatus.automatic_stop_reach_target, rawStatus.autoStopState),
            night_light_brightness: this.numberValue(rawStatus.night_light_brightness, rawStatus.nightLight?.brightness, rawStatus.brightness),
            autoStopSwitch: this.booleanValue(rawStatus.autoStopSwitch),
            indicator_light_switch: this.booleanValue(rawStatus.indicator_light_switch, rawStatus.screenSwitch),
            configuration: {
                ...configuration,
                auto_target_humidity: targetHumidity
            }
        };
    }

}
