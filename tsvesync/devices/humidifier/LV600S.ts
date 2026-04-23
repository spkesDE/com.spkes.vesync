import BasicHumidifier from "../../lib/BasicHumidifier";
import DeviceModes from "../../enum/DeviceModes";
import IApiResponse from "../../models/IApiResponse";

export default class LV600S extends BasicHumidifier {
    static deviceModels = ['LUH-A602S-WUSR', 'LUH-A602S-WUS', 'LUH-A602S-WEUR', 'LUH-A602S-WEU', 'LUH-A602S-WJP', 'LUH-A602S-WUSC', 'LUH-A603S-WUS', 'LUH-A603S-WEU'];
    static methods = ['getHumidifierStatus', 'setAutomaticStop', 'setSwitch', 'setVirtualLevel', 'setTargetHumidity', 'setHumidityMode', 'setDisplay', 'setLevel'];
    static features = ['warm_mist'];
    static levels = [1, 2, 3, 4, 5, 6, 7, 8, 9];
    static modes = [DeviceModes.Humidity, DeviceModes.Sleep, DeviceModes.Manual];
    static warm_levels = [0, 1, 2, 3];

    public async setSwitch(payload: boolean): Promise<IApiResponse<any>> {
        if (!this.usesModernApi()) return super.setSwitch(payload);
        return await this.post('setSwitch', {
            powerSwitch: Number(payload),
            switchIdx: 0
        });
    }

    public async setLevel(payload: number): Promise<IApiResponse<any>> {
        if (!this.usesModernApi()) return super.setLevel(payload);
        if (!this.hasLevel(payload)) return Promise.reject(new Error('Invalid level'));
        return await this.post('setVirtualLevel', {
            levelIdx: 0,
            virtualLevel: payload,
            levelType: 'mist'
        });
    }

    public async setHumidityMode(payload: DeviceModes): Promise<IApiResponse<any>> {
        if (!this.usesModernApi()) return super.setHumidityMode(payload);
        return await this.post('setHumidityMode', {
            workMode: payload.toLowerCase()
        });
    }

    public async setTargetHumidity(payload: number): Promise<IApiResponse<any>> {
        if (!this.usesModernApi()) return super.setTargetHumidity(payload);
        if (payload < 0 || payload > 100) return Promise.reject(new Error('Humidity must be between 0 and 100'));
        return await this.post('setTargetHumidity', {
            targetHumidity: payload
        });
    }

    public async setDisplay(payload: boolean): Promise<IApiResponse<any>> {
        if (!this.usesModernApi()) return super.setDisplay(payload);
        return await this.post('setDisplay', {
            screenSwitch: Number(payload)
        });
    }

    public async setWarmLevel(payload: number): Promise<IApiResponse<any>> {
        if (!LV600S.hasWarmLevel(payload)) return Promise.reject('Invalid warm level');
        if (this.usesModernApi()) {
            return await this.post('setLevel', {
                levelIdx: 0,
                levelType: 'warm',
                mistLevel: this.status?.mist_level ?? 0,
                warmLevel: payload
            });
        }
        return await this.post('setLevel', {
            id: 0,
            level: payload,
            type: 'warm'
        });
    }

    private usesModernApi(): boolean {
        return this.device.deviceType.startsWith('LUH-A603S');
    }
}
