import DeviceModes from "../../enum/DeviceModes";

import IApiResponse from "../../models/IApiResponse";
import BasicPurifier from "../../lib/BasicPurifier";


export default class Core300S extends BasicPurifier {
    static deviceModels = ['Core300S', 'LAP-C301S-WJP', 'LAP-C302S-WUSB'];
    static methods = ['getPurifierStatus', 'setSwitch', 'setNightLight', 'setLevel', 'setPurifierMode', 'setDisplay', 'setChildLock', 'setIndicatorLight'];
    static modes = [DeviceModes.Auto, DeviceModes.Manual, DeviceModes.Sleep, DeviceModes.Off];
    static levels = [1, 2, 3, 4, 5];
    static features = ['air_quality']

    public async setLevel(payload: number): Promise<IApiResponse<any>> {
        //Validate the level
        if (!Core300S.levels.includes(payload)) {
            throw new Error(`Invalid level: ${payload}`);
        }
        return super.setLevel(payload);
    }

    public async setPurifierMode(mode: DeviceModes): Promise<IApiResponse<any>> {
        //Validate the mode
        if (!Core300S.modes.includes(mode)) {
            throw new Error(`Invalid mode: ${mode}`);
        }
        return super.setPurifierMode(mode);
    }
}