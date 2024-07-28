
import DeviceModes from "../../enum/DeviceModes";

import BasicPurifier from "../../lib/BasicPurifier";


export default class Vital200S extends BasicPurifier {
    static deviceModels = ['LAP-V201S-AASR', 'LAP-V201S-WJP', 'LAP-V201S-WEU',
        'LAP-V201S-WUS', 'LAP-V201-AUSR', 'LAP-V201S-AEUR'];
    static methods = ['getPurifierStatus', 'setSwitch', 'setNightLight',
        'setLevel', 'setPurifierMode', 'setDisplay',
        'setChildLock', 'setIndicatorLight'];
    static modes = [DeviceModes.Auto, DeviceModes.Manual, DeviceModes.Sleep, DeviceModes.Pet, DeviceModes.Off];
    static levels = [1, 2, 3, 4];
    static features = ['air_quality'];

    protected hasMethod(method: string): boolean {
        return Vital200S.methods.includes(method);
    }
}