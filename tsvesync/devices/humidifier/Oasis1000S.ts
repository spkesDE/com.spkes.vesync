import BasicHumidifier from "../../lib/BasicHumidifier";
import DeviceModes from "../../enum/DeviceModes";
import IGetOasis1000SStatus from "../../models/humidifier/IGetOasis1000SStatus";
import IApiResponse from "../../models/IApiResponse";

export default class Oasis1000S extends BasicHumidifier<IGetOasis1000SStatus> {
    static deviceModels = ['LUH-M101S-WUS', 'LUH-M101S-WEUR'];
    static methods = ['getHumidifierStatus', 'setAutoStopSwitch', 'setSwitch', 'setVirtualLevel', 'setTargetHumidity', 'setHumidityMode', 'setDisplay', 'setNightLightBrightness'];
    static features = [];
    static levels = [1, 2, 3, 4, 5, 6, 7, 8, 9];
    static modes = [DeviceModes.Auto, DeviceModes.Sleep, DeviceModes.Manual];

    public async getHumidifierStatus(): Promise<IApiResponse<any>> {
        const status = await this.post<IGetOasis1000SStatus>('getHumidifierStatus', {});
        this.status = status.result.result;
        return status;
    }

    public async setDisplay(payload: boolean): Promise<IApiResponse<any>> {
        return await this.post('setDisplay', {
            screenSwitch: Number(payload)
        });
    }

    public async setHumidityMode(payload: string): Promise<IApiResponse<any>> {
        return await this.post('setHumidityMode', {
            workMode: payload.toLowerCase()
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