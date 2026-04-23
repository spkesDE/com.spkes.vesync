import DeviceModes from "../../enum/DeviceModes";
import IApiResponse from "../../models/IApiResponse";
import BasicPurifier from "../../lib/BasicPurifier";

export default class SproutAir extends BasicPurifier {
    static deviceModels = [
        'LAP-B851S-WEU',
        'LAP-B851S-WNA',
        'LAP-B851S-AEUR',
        'LAP-B851S-AUS',
        'LAP-B851S-WUS',
        'LAP-BAY-MAX01S'
    ];
    static methods = ['getPurifierStatus', 'setSwitch', 'setLevel', 'setNightLight', 'setChildLock', 'setDisplay', 'setAutoPreference', 'setPurifierMode'];
    static modes = [DeviceModes.Auto, DeviceModes.Manual, DeviceModes.Sleep, DeviceModes.Off];
    static levels = [1, 2, 3];
    static features = ['air_quality', 'nightlight'];

    public async getPurifierStatus(): Promise<IApiResponse<any>> {
        const status = await this.post<any>('getPurifierStatus', {});
        if (status.msg !== 'request success') return status;

        const rawStatus = status.result?.result ?? {};
        const normalizedStatus = {
            ...rawStatus,
            fanSpeedLevel: rawStatus.fanSpeedLevel === 255 ? 0 : rawStatus.fanSpeedLevel,
            night_light: rawStatus.nightlight?.nightLightSwitch === 1 ? 'on' : 'off',
            filter_life: 100,
            replace_filter: false
        };

        this.status = this.normalizePurifierStatus(normalizedStatus);
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
        if (!SproutAir.levels.includes(payload)) {
            throw new Error(`Invalid level: ${payload}`);
        }
        return await this.post('setLevel', {
            levelIdx: 0,
            manualSpeedLevel: payload,
            levelType: 'wind'
        });
    }

    public async setPurifierMode(mode: DeviceModes): Promise<IApiResponse<any>> {
        const workMode = mode === DeviceModes.Normal ? DeviceModes.Manual : mode;
        if (!SproutAir.modes.includes(workMode)) {
            throw new Error(`Invalid mode: ${workMode}`);
        }
        return await this.post('setPurifierMode', {
            workMode
        });
    }

    public async setDisplay(payload: boolean): Promise<IApiResponse<any>> {
        return await this.post('setDisplay', {
            screenSwitch: Number(payload)
        });
    }

    public async setChildLock(payload: boolean): Promise<IApiResponse<any>> {
        return await this.post('setChildLock', {
            childLockSwitch: Number(payload)
        });
    }
}
