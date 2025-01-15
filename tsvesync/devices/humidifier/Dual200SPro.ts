import BasicHumidifier from "../../lib/BasicHumidifier";
import DeviceModes from "../../enum/DeviceModes";

export default class Dual200SPro extends BasicHumidifier {
    static deviceModels = ['LUH-D301S-KEUR'];
    static methods = ['getHumidifierStatus', 'setAutomaticStop', 'setSwitch', 'setNightLightBrightness', 'setVirtualLevel', 'setTargetHumidity', 'setHumidityMode', 'setDisplay', 'setLevel'];
    static features = [];
    static levels = [1, 2, 3];
    static modes = [DeviceModes.Auto, DeviceModes.Manual, DeviceModes.Sleep];

}