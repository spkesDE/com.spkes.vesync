import BasicHumidifier from "../../lib/BasicHumidifier";
import DeviceModes from "../../enum/DeviceModes";

export default class Classic300S extends BasicHumidifier {
    static deviceModels = ['Classic300S'];
    static methods = ['getHumidifierStatus', 'setAutomaticStop', 'setSwitch', 'setVirtualLevel', 'setTargetHumidity', 'setHumidityMode', 'setIndicatorLightSwitch'];
    static levels = [1, 2, 3, 4, 5, 6, 7, 8, 9];
    static modes = [DeviceModes.Auto, DeviceModes.Manual];

    protected hasMethod(method: string): boolean {
        return Classic300S.methods.includes(method);
    }

}