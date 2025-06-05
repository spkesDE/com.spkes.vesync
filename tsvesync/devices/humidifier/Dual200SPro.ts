import BasicHumidifier from "../../lib/BasicHumidifier";
import DeviceModes from "../../enum/DeviceModes";
import IApiResponse from "../../models/IApiResponse";
import IGetHumidifierStatus from "../../models/humidifier/IGetHumidifierStatus";

export default class Dual200SPro extends BasicHumidifier {
    static deviceModels = ['LUH-D301S-KEUR'];
    static methods = ['getHumidifierStatus', 'setAutomaticStop', 'setSwitch', 'setNightLightBrightness', 'setVirtualLevel', 'setTargetHumidity', 'setHumidityMode', 'setDisplay', 'setLevel'];
    static features = [];
    static levels = [1, 2, 3];
    static modes = [DeviceModes.Auto, DeviceModes.Manual, DeviceModes.Sleep];

    async getHumidifierStatus(): Promise<IApiResponse<IGetHumidifierStatus>> {
        const superData = await super.getHumidifierStatus();
        console.log('Dual200SPro getHumidifierStatus', superData);
        return superData;
    }
}