import BasicHumidifier from "../../lib/BasicHumidifier";
import DeviceModes from "../../enum/DeviceModes";

export default class LV600S extends BasicHumidifier {
    static deviceModels = ['LUH-A602S-WUSR', 'LUH-A602S-WUS', 'LUH-A602S-WEUR', 'LUH-A602S-WEU', 'LUH-A602S-WJP'];
    static methods = ['getHumidifierStatus', 'setAutomaticStop', 'setSwitch', 'setVirtualLevel', 'setTargetHumidity', 'setHumidityMode', 'setDisplay', 'setLevel'];
    static features = ['warm_mist'];
    static levels = [1, 2, 3, 4, 5, 6, 7, 8, 9];
    static modes = [DeviceModes.Humidity, DeviceModes.Sleep, DeviceModes.Manual];
    static warm_levels = [0, 1, 2, 3];

    protected hasMethod(method: string): boolean {
        return LV600S.methods.includes(method);
    }
}