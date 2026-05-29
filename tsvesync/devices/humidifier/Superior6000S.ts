import BasicHumidifier from "../../lib/BasicHumidifier";
import DeviceModes from "../../enum/DeviceModes";
import IApiResponse from "../../models/IApiResponse";

export default class Superior6000S extends BasicHumidifier {
    static deviceModels = ['LEH-S601S-WUS', 'LEH-S601S-WUSR', 'LEH-S601S-WEUR', 'LEH-S602S-WUS'];
    static methods = ['getHumidifierStatus', 'setAutoStopSwitch', 'setSwitch', 'setVirtualLevel', 'setTargetHumidity', 'setHumidityMode', 'setDisplay', 'setNightLightBrightness'];
    static features = [];
    static levels = [1, 2, 3, 4, 5, 6, 7, 8, 9];
    static modes = [DeviceModes.Auto, DeviceModes.Sleep, DeviceModes.Manual, DeviceModes.Humidity];

    public async getHumidifierStatus(): Promise<IApiResponse<any>> {
        const status = await this.post<any>('getHumidifierStatus', {});
        if (status.msg !== 'request success') {
            return status;
        }

        const rawStatus = status.result?.result ?? {};
        this.status = this.normalizeHumidifierStatus({
            ...rawStatus,
            workMode: rawStatus.workMode === 'autoPro' ? DeviceModes.Auto : rawStatus.workMode
        });

        return {
            ...status,
            result: {
                traceId: status.result.traceId,
                code: status.result.code,
                result: this.status
            }
        };
    }

    public async setDisplay(payload: boolean): Promise<IApiResponse<any>> {
        return await this.post('setDisplay', {
            screenSwitch: Number(payload)
        });
    }

    public async setHumidityMode(payload: string): Promise<IApiResponse<any>> {
        return await this.post('setHumidityMode', {
            workMode: payload.toLowerCase() === DeviceModes.Auto ? 'autoPro' : payload.toLowerCase()
        });
    }

    public async setMistLevel(payload: number): Promise<IApiResponse<any>> {
        if (!this.hasLevel(payload)) return Promise.reject('Invalid mist level');
        return await this.post('setVirtualLevel', {
            levelIdx: 0,
            virtualLevel: payload,
            levelType: 'mist'
        });
    }

    public async setSwitch(payload: boolean): Promise<IApiResponse<any>> {
        return await this.post('setSwitch', {
            powerSwitch: Number(payload),
            switchIdx: 0
        });
    }

    public async setTargetHumidity(payload: number): Promise<IApiResponse<any>> {
        if (payload < 0 || payload > 100) return Promise.reject(new Error('Humidity must be between 0 and 100'));
        return await this.post('setTargetHumidity', {
            targetHumidity: payload
        });
    }

    public async setAutoStopSwitch(payload: boolean): Promise<IApiResponse<any>> {
        return await this.post('setAutoStopSwitch', {
            autoStopSwitch: Number(payload)
        });
    }

    public async setNightLightBrightness(payload: number): Promise<IApiResponse<any>> {
        if (payload < 0 || payload > 100) return Promise.reject(new Error('Brightness must be between 0 and 100'));
        return await this.post('setNightLightBrightness', {
            nightLightBrightness: payload
        });
    }


}
