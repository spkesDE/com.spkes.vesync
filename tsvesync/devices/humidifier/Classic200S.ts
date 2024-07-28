import DeviceModes from "../../enum/DeviceModes";
import BasicHumidifier from "../../lib/BasicHumidifier";

export default class Classic200S extends BasicHumidifier {
    static deviceModels = ['Classic200S', 'LUH-A601S-WUSB'];
    static methods = ['getHumidifierStatus', 'setAutomaticStop', 'setSwitch', 'setNightLightBrightness', 'setVirtualLevel', 'setTargetHumidity', 'setHumidityMode', 'setDisplay', 'setLevel'];
    static features = ['nightlight'];
    static levels = [1, 2, 3, 4, 5, 6, 7, 8, 9];
    static modes = [DeviceModes.Auto, DeviceModes.Sleep, DeviceModes.Manual];

    protected hasMethod(method: string): boolean {
        return Classic200S.methods.includes(method);
    }

}