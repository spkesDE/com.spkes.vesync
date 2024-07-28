
import DeviceModes from "../../enum/DeviceModes";
import BasicPurifierV2 from "../../lib/BasicPurifierV2";
import ISetLevelPayload from "../../models/purifier/v2/ISetLevelPayload";
import IApiResponse from "../../models/IApiResponse";
import ISetPurifierModePayload from "../../models/purifier/v2/ISetPurifierModePayload";


export default class Vital200S extends BasicPurifierV2 {
    static deviceModels = ['LAP-V201S-AASR', 'LAP-V201S-WJP', 'LAP-V201S-WEU',
        'LAP-V201S-WUS', 'LAP-V201-AUSR', 'LAP-V201S-AEUR'];
    static methods = ['getPurifierStatus', 'setSwitch', 'setLevel', 'setLightDetection', 'setChildLock', 'setDisplay', 'setAutoPreference', 'setPurifierMode'];
    static modes = [DeviceModes.Auto, DeviceModes.Manual, DeviceModes.Sleep, DeviceModes.Pet, DeviceModes.Off];
    static levels = [1, 2, 3, 4];
    static features = ['air_quality'];

    protected hasMethod(method: string): boolean {
        return Vital200S.methods.includes(method);
    }

    public async setLevel(payload: ISetLevelPayload): Promise<IApiResponse<any>> {
        //Validate the level
        if (!Vital200S.levels.includes(payload.manualSpeedLevel)) {
            throw new Error(`Invalid level: ${payload.manualSpeedLevel}`);
        }
        return super.setLevel(payload);
    }

    public async setPurifierMode(mode: ISetPurifierModePayload): Promise<IApiResponse<any>> {
        //Validate the mode
        if (!Vital200S.modes.includes(mode.workMode)) {
            throw new Error(`Invalid mode: ${mode.workMode}`);
        }
        return super.setPurifierMode(mode);
    }
}