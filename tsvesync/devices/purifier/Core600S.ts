import BasicPurifier from "../../lib/BasicPurifier";
import DeviceModes from "../../enum/DeviceModes";

import IApiResponse from "../../models/IApiResponse";


export default class Core600S extends BasicPurifier {
    static deviceModels = ['Core600S', 'LAP-C601S-WUS', 'LAP-C601S-WUSR', 'LAP-C601S-WEU'];
    static methods = ['getPurifierStatus', 'setSwitch', 'setNightLight', 'setLevel', 'setPurifierMode', 'setDisplay', 'setChildLock', 'setIndicatorLight'];
    static modes = [DeviceModes.Auto, DeviceModes.Manual, DeviceModes.Sleep, DeviceModes.Off];
    static levels = [1, 2, 3, 4];
    static features = ['air_quality']

    public async setLevel(payload: number): Promise<IApiResponse<any>> {
        //Validate the level
        if (!Core600S.levels.includes(payload)) {
            throw new Error(`Invalid level: ${payload}`);
        }
        return super.setLevel(payload);
    }

    public async setPurifierMode(mode: DeviceModes): Promise<IApiResponse<any>> {
        //Validate the mode
        if (!Core600S.modes.includes(mode)) {
            throw new Error(`Invalid mode: ${mode}`);
        }
        return super.setPurifierMode(mode);
    }
}