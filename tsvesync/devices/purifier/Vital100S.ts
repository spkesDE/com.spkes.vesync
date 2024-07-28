
import DeviceModes from "../../enum/DeviceModes";

import BasicPurifier from "../../lib/BasicPurifier";


export default class Vital100S extends BasicPurifier {
    static deviceModels = ['LAP-V102S-AASR', 'LAP-V102S-WUS', 'LAP-V102S-WEU',
        'LAP-V102S-AUSR', 'LAP-V102S-WJP'];
    static methods = ['getPurifierStatus', 'setSwitch', 'setNightLight', 'setLevel', 'setPurifierMode', 'setDisplay', 'setChildLock', 'setIndicatorLight'];
    static modes = [DeviceModes.Auto, DeviceModes.Manual, DeviceModes.Sleep, DeviceModes.Pet, DeviceModes.Off];
    static levels = [1, 2, 3, 4];
    static features = ['air_quality'];

    protected hasMethod(method: string): boolean {
        return Vital100S.methods.includes(method);
    }
}