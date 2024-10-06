import BasicHumidifier from "../../lib/BasicHumidifier";
import DeviceModes from "../../enum/DeviceModes";
import IApiResponse from "../../models/IApiResponse";

export default class Classic300S extends BasicHumidifier {
    static deviceModels = ['Classic300S'];
    static methods = ['getHumidifierStatus', 'setAutomaticStop', 'setSwitch', 'setVirtualLevel', 'setTargetHumidity', 'setHumidityMode', 'setIndicatorLightSwitch'];
    static features = [];
    static levels = [1, 2, 3, 4, 5, 6, 7, 8, 9];
    static modes = [DeviceModes.Auto, DeviceModes.Manual];


    public async setDisplay(payload: boolean): Promise<IApiResponse<any>> {
        return await this.post('setIndicatorLightSwitch', {
            state: Number(payload)
        });
    }

}