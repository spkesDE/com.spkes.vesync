import BasicHumidifier from "../../lib/BasicHumidifier";
import DeviceModes from "../../enum/DeviceModes";
import IApiResponse from "../../models/IApiResponse";

export default class Oasis450S extends BasicHumidifier {
    static deviceModels = ['LUH-O451S-WUS', 'LUH-O451S-WEU'];
    static methods = ['getHumidifierStatus', 'setAutomaticStop', 'setSwitch', 'setVirtualLevel', 'setTargetHumidity', 'setHumidityMode', 'setDisplay', 'setLevel'];
    static features = ['warm_mist'];
    static levels = [1, 2, 3, 4, 5, 6, 7, 8, 9];
    static modes = [DeviceModes.Humidity, DeviceModes.Sleep, DeviceModes.Manual];
    static warm_levels = [0, 1, 2, 3];

    public async setWarmLevel(payload: number): Promise<IApiResponse<any>> {
        if (!Oasis450S.hasWarmLevel(payload)) return Promise.reject('Invalid warm level');
        return await this.post('setLevel', {
            id: 0,
            level: payload,
            type: 'warm'
        });
    }
}