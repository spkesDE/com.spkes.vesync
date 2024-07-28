import DeviceModes from "../../enum/DeviceModes";

import IApiResponse from "../../models/IApiResponse";
import ISetLevelPayload from "../../models/purifier/ISetLevelPayload";
import ISetPurifierModePayload from "../../models/purifier/ISetPurifierModePayload";
import BasicPurifier from "../../lib/BasicPurifier";


export default class Core300S extends BasicPurifier {
    static deviceModels = ['Core300S', 'LAP-C301S-WJP', 'LAP-C302S-WUSB'];
    static methods = ['getPurifierStatus', 'setSwitch', 'setNightLight', 'setLevel', 'setPurifierMode', 'setDisplay', 'setChildLock', 'setIndicatorLight'];
    static modes = [DeviceModes.Auto, DeviceModes.Manual, DeviceModes.Sleep, DeviceModes.Off];
    static levels = [1, 2, 3, 4, 5];
    static features = ['air_quality']

    protected hasMethod(method: string): boolean {
        return Core300S.methods.includes(method);
    }

    public async setLevel(payload: ISetLevelPayload): Promise<IApiResponse<any>> {
        //Validate the level
        if (!Core300S.levels.includes(payload.level)) {
            throw new Error(`Invalid level: ${payload.level}`);
        }
        return super.setLevel(payload);
    }

    public async setPurifierMode(mode: ISetPurifierModePayload): Promise<IApiResponse<any>> {
        //Validate the mode
        if (!Core300S.modes.includes(mode.mode)) {
            throw new Error(`Invalid mode: ${mode.mode}`);
        }
        return super.setPurifierMode(mode);
    }
}