import DeviceModes from "../../enum/DeviceModes";
import BasicTowerFan from "../../lib/BasicTowerFan";
import IApiResponse from "../../models/IApiResponse";
import {ISetLevelPayload} from "../../models/towerfan/ISetLevelPayload";
import {ISetTowerFanModePayload} from "../../models/towerfan/ISetTowerFanModePayload";
import {IGetTowerFanStatus} from "../../models/towerfan/IGetTowerFanStatus";

export default class F422S extends BasicTowerFan {
    static deviceModels = ['LTF-F422S-KEU', 'LTF-F422S-WUSR', 'LTF-F422_WJP', 'LTF-F422S-WUS'];
    static methods = ['getTowerFanStatus', 'setDisplay', 'setDisplayingType', 'setLevel', 'setMuteSwitch', 'setOscillationSwitch', 'setSleepPreference', 'setSwitch', 'setTowerFanMode'];
    static levels = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
    static modes = [DeviceModes.AdvancedSleep, DeviceModes.Auto, DeviceModes.Turbo, DeviceModes.Normal]

    protected hasMethod(method: string): boolean {
        return F422S.methods.includes(method);
    }

    async setLevel(payload: ISetLevelPayload): Promise<IApiResponse<any>> {
        if (!F422S.levels.includes(payload.manualSpeedLevel)) {
            throw new Error(`Invalid level: ${payload.manualSpeedLevel}`);
        }
        return super.setLevel(payload);
    }

    async setTowerFanMode(mode: ISetTowerFanModePayload): Promise<IApiResponse<any>> {
        if (!F422S.modes.includes(mode.workMode)) {
            throw new Error(`Invalid mode: ${mode}`);
        }
        return super.setTowerFanMode(mode);
    }

    async getTowerFanStatus(): Promise<IApiResponse<IGetTowerFanStatus>> {
        const result = await super.getTowerFanStatus();
        if (result.result.result.temperature) result.result.result.temperature = this.convertTemperature(result.result.result.temperature);
        return result;
    }

    /**
     * Convert temperature from raw value to Celsius. Some crazy math here. I have no idea how the raw value is calculated and how VeSync converts it to Celsius.
     * This should be a good approximation. If you have a better way to convert it, please let me know.
     * @param temperature
     * @private
     */
    private convertTemperature(temperature: number): number {
        const a = 0.0326;
        let temp = temperature * a - 0.1896;
        // Round to 1 decimal places
        return Math.round(temp * 10) / 10;
    }
}