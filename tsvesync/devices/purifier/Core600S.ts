import BasicPurifier from "../../lib/BasicPurifier";
import DeviceModes from "../../enum/DeviceModes";

import IApiResponse from "../../models/IApiResponse";
import ISetLevelPayload from "../../models/purifier/ISetLevelPayload";
import ISetPurifierModePayload from "../../models/purifier/ISetPurifierModePayload";


export default class Core600S extends BasicPurifier {
    static deviceModels = ['Core600S', 'LAP-C601S-WUS', 'LAP-C601S-WUSR', 'LAP-C601S-WEU'];
    static methods = ['getPurifierStatus', 'setSwitch', 'setNightLight', 'setLevel', 'setPurifierMode', 'setDisplay', 'setChildLock', 'setIndicatorLight'];
    static modes = [DeviceModes.Auto, DeviceModes.Manual, DeviceModes.Sleep, DeviceModes.Off];
    static levels = [1, 2, 3, 4];
    static features = ['air_quality']

    protected hasMethod(method: string): boolean {
        return Core600S.methods.includes(method);
    }

    public async setLevel(payload: ISetLevelPayload): Promise<IApiResponse<any>> {
        //Validate the level
        if (!Core600S.levels.includes(payload.level)) {
            throw new Error(`Invalid level: ${payload.level}`);
        }
        return super.setLevel(payload);
    }

    public async setPurifierMode(mode: ISetPurifierModePayload): Promise<IApiResponse<any>> {
        //Validate the mode
        if (!Core600S.modes.includes(mode.mode)) {
            throw new Error(`Invalid mode: ${mode.mode}`);
        }
        return super.setPurifierMode(mode);
    }
}