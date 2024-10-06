import DeviceModes from "../../enum/DeviceModes";
import BasicTowerFan from "../../lib/BasicTowerFan";
import IApiResponse from "../../models/IApiResponse";
import {IGetTowerFanStatus} from "../../models/towerfan/IGetTowerFanStatus";

export default class F422S extends BasicTowerFan {
    static deviceModels = ['LTF-F422S-KEU', 'LTF-F422S-WUSR', 'LTF-F422_WJP', 'LTF-F422S-WUS'];
    static methods = ['getTowerFanStatus', 'setDisplay', 'setDisplayingType', 'setLevel', 'setMuteSwitch', 'setOscillationSwitch', 'setSleepPreference', 'setSwitch', 'setTowerFanMode'];
    static levels = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
    static modes = [DeviceModes.AdvancedSleep, DeviceModes.Auto, DeviceModes.Turbo, DeviceModes.Normal]

    async setLevel(payload: number): Promise<IApiResponse<any>> {
        if (!F422S.levels.includes(payload)) {
            throw new Error(`Invalid level: ${payload}`);
        }
        return super.setLevel(payload);
    }

    async setTowerFanMode(mode: DeviceModes): Promise<IApiResponse<any>> {
        if (!F422S.modes.includes(mode)) {
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
     * Convert temperature from raw value to Celsius or back to Fahrenheit.
     * The raw value is Fahrenheit * 10. So 655 is 65.5 Fahrenheit.
     * @param temperature - The raw temperature value (Fahrenheit * 10).
     * @param toCelsius - If true, convert to Celsius. Otherwise, return in Fahrenheit.
     * @private
     */
    private convertTemperature(temperature: number, toCelsius = true): number {
        const fahrenheit = temperature / 10;
        return toCelsius
            ? (fahrenheit - 32) * 5 / 9
            : fahrenheit;
    }
}