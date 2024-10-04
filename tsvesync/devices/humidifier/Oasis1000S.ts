import BasicHumidifier from "../../lib/BasicHumidifier";
import DeviceModes from "../../enum/DeviceModes";

import VeSync from "../../veSync";
import {IDevice} from "../../models/IDevice";

export default class Oasis1000S extends BasicHumidifier {
    static deviceModels = ['LUH-M101S-WUS', 'LUH-M101S-WEUR'];
    static methods = ['getHumidifierStatus', 'setAutoStopSwitch', 'setSwitch', 'setVirtualLevel', 'setTargetHumidity', 'setHumidityMode', 'setDisplay', 'setNightLightBrightness'];
    static levels = [1, 2, 3, 4, 5, 6, 7, 8, 9];
    static modes = [DeviceModes.Auto, DeviceModes.Sleep, DeviceModes.Manual];

    protected hasMethod(method: string): boolean {
        return Oasis1000S.methods.includes(method);
    }

}