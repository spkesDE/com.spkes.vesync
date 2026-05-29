import BasicHumidifier from "../../lib/BasicHumidifier";
import DeviceModes from "../../enum/DeviceModes";
import IApiResponse from "../../models/IApiResponse";

export default class SproutHumidifier extends BasicHumidifier {
    static deviceModels = ['LEH-B381S-WUS', 'LEH-B381S-WEU'];
    static methods = ['getHumidifierStatus', 'setSwitch', 'setVirtualLevel', 'setTargetHumidity', 'setHumidityMode', 'setDisplay', 'setLightStatus'];
    static features = ['nightlight'];
    static levels = [1, 2];
    static modes = [DeviceModes.Auto, DeviceModes.Sleep, DeviceModes.Manual];

    public async getHumidifierStatus(): Promise<IApiResponse<any>> {
        const status = await this.post<any>('getHumidifierStatus', {});
        if (!status) throw new Error('Failed to get humidifier status');
        if (status.msg !== 'request success') return status;

        const rawStatus = status.result?.result ?? {};
        this.status = this.normalizeHumidifierStatus({
            ...rawStatus,
            workMode: rawStatus.workMode === 'autoPro' ? DeviceModes.Auto : rawStatus.workMode
        });

        return {
            ...status,
            result: {
                ...status.result,
                result: this.status
            }
        };
    }

    public async setSwitch(payload: boolean): Promise<IApiResponse<any>> {
        return await this.post('setSwitch', {
            powerSwitch: Number(payload),
            switchIdx: 0
        });
    }

    public async setLevel(payload: number): Promise<IApiResponse<any>> {
        if (!this.hasLevel(payload)) return Promise.reject(new Error('Invalid level'));
        return await this.post('setVirtualLevel', {
            levelIdx: 0,
            virtualLevel: payload,
            levelType: 'mist'
        });
    }

    public async setHumidityMode(payload: DeviceModes): Promise<IApiResponse<any>> {
        return await this.post('setHumidityMode', {
            workMode: payload === DeviceModes.Auto ? 'autoPro' : payload.toLowerCase()
        });
    }

    public async setTargetHumidity(payload: number): Promise<IApiResponse<any>> {
        if (payload < 0 || payload > 100) return Promise.reject(new Error('Humidity must be between 0 and 100'));
        return await this.post('setTargetHumidity', {
            targetHumidity: payload
        });
    }

    public async setDisplay(payload: boolean): Promise<IApiResponse<any>> {
        return await this.post('setDisplay', {
            screenSwitch: Number(payload)
        });
    }

    public async setNightLightBrightness(payload: number): Promise<IApiResponse<any>> {
        if (payload < 0 || payload > 100) return Promise.reject(new Error('Brightness must be between 0 and 100'));
        return await this.post('setLightStatus', {
            brightness: payload,
            colorTemperature: 3500,
            nightLightSwitch: payload > 0 ? 1 : 0
        });
    }
}
