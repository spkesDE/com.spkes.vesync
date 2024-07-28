
import DeviceModes from "../../enum/DeviceModes";

import BasicPurifier from "../../lib/BasicPurifier";
import ISetLevelPayload from "../../models/purifier/v2/ISetLevelPayload";
import IApiResponse from "../../models/IApiResponse";
import ISetPurifierModePayload from "../../models/purifier/v2/ISetPurifierModePayload";
import BasicPurifierV2 from "../../lib/BasicPurifierV2";


export default class Vital100S extends BasicPurifierV2 {
    static deviceModels = ['LAP-V102S-AASR', 'LAP-V102S-WUS', 'LAP-V102S-WEU',
        'LAP-V102S-AUSR', 'LAP-V102S-WJP'];
    static methods = ['getPurifierStatus', 'setSwitch', 'setLevel', 'setLightDetection', 'setChildLock', 'setDisplay', 'setAutoPreference', 'setPurifierMode'];
    static modes = [DeviceModes.Auto, DeviceModes.Manual, DeviceModes.Sleep, DeviceModes.Pet, DeviceModes.Off];
    static levels = [1, 2, 3, 4];
    static features = ['air_quality'];

    protected hasMethod(method: string): boolean {
        return Vital100S.methods.includes(method);
    }

    public async setLevel(payload: ISetLevelPayload): Promise<IApiResponse<any>> {
        //Validate the level
        if (!Vital100S.levels.includes(payload.manualSpeedLevel)) {
            throw new Error(`Invalid level: ${payload.manualSpeedLevel}`);
        }
        return super.setLevel(payload);
    }

    public async setPurifierMode(mode: ISetPurifierModePayload): Promise<IApiResponse<any>> {
        //Validate the mode
        if (!Vital100S.modes.includes(mode.workMode)) {
            throw new Error(`Invalid mode: ${mode.workMode}`);
        }
        return super.setPurifierMode(mode);
    }
}