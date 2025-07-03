import DeviceModes from "../../enum/DeviceModes";
import BasicPurifier from "../../lib/BasicPurifier";
import IApiResponse from "../../models/IApiResponse";

export default class EverestAir extends BasicPurifier {
    static deviceModels = ['LAP-EL551S-AUS', 'LAP-EL551S-AEUR', 'LAP-EL551S-WEU', 'LAP-EL551S-WUS'];
    static methods = ['getPurifierStatus', 'setSwitch', 'setLevel', 'setLightDetection', 'setChildLock', 'setDisplay', 'setAutoPreference', 'setPurifierMode'];
    static modes = [DeviceModes.Auto, DeviceModes.Manual, DeviceModes.Sleep, DeviceModes.Turbo, DeviceModes.Off];
    static levels = [1, 2, 3, 4];
    static features = ['air_quality', 'fan_rotate'];


    public async getPurifierStatus(): Promise<IApiResponse<any>> {
        const status = await this.post<any>('getPurifierStatus', {});
        this.status = status.result.result;
        return status;
    }

    public async setSwitch(payload: boolean): Promise<IApiResponse<any>> {
        return await this.post('setSwitch', {
            powerSwitch: Number(payload),
            switchIdx: 0
        });
    }

    public async setLevel(payload: number): Promise<IApiResponse<any>> {
        if (!EverestAir.levels.includes(payload)) {
            throw new Error(`Invalid level: ${payload}`);
        }
        return await this.post('setLevel', {
            levelIdx: 0,
            manualSpeedLevel: payload,
            levelType: "wind"
        });
    }

    public async setPurifierMode(mode: DeviceModes): Promise<IApiResponse<any>> {
        if (!EverestAir.modes.includes(mode)) {
            throw new Error(`Invalid mode: ${mode}`);
        }
        return await this.post('setPurifierMode', {
            workMode: mode
        });
    }

    public async setDisplay(payload: boolean): Promise<IApiResponse<any>> {
        return await this.post('setDisplay', {
            screenSwitch: Number(payload)
        });
    }

    public async setChildLock(payload: boolean): Promise<IApiResponse<any>> {
        return await this.post('setChildLock', {
            childLockSwitch: Number(payload),
        });
    }

    public async resetFilter(): Promise<IApiResponse<any>> {
        return await this.post('resetFilter', {});
    }
}