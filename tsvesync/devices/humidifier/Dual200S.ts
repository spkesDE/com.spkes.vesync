import BasicHumidifier from "../../lib/BasicHumidifier";
import DeviceModes from "../../enum/DeviceModes";

export default class Dual200S extends BasicHumidifier {
    static deviceModels = ['Dual200S', 'LUH-D301S-WUSR', 'LUH-D301S-WJP', 'LUH-D301S-WEU'];
    static methods = ['getHumidifierStatus', 'setAutomaticStop', 'setSwitch', 'setNightLightBrightness', 'setVirtualLevel', 'setTargetHumidity', 'setHumidityMode', 'setDisplay', 'setLevel'];
    static features = [];
    static levels = [1, 2, 3];
    static modes = [DeviceModes.Auto, DeviceModes.Manual];

    protected hasMethod(method: string): boolean {
        return Dual200S.methods.includes(method);
    }
}