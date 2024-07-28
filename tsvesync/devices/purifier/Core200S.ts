import DeviceModes from "../../enum/DeviceModes";
import ISetLevelPayload from "../../models/purifier/ISetLevelPayload";
import ISetPurifierModePayload from "../../models/purifier/ISetPurifierModePayload";
import IApiResponse from "../../models/IApiResponse";
import BasicPurifier from "../../lib/BasicPurifier";


export default class Core200S extends BasicPurifier {
    static deviceModels = ['Core200S', 'LAP-C201S-AUSR', 'LAP-C202S-WUSR'];
    static methods = ['getPurifierStatus', 'setSwitch', 'setNightLight', 'setLevel', 'setPurifierMode', 'setDisplay', 'setChildLock', 'setIndicatorLight'];
    static features = [];
    static levels = [1, 2, 3];
    static modes = [DeviceModes.Manual, DeviceModes.Sleep, DeviceModes.Off];

    protected hasMethod(method: string): boolean {
        return Core200S.methods.includes(method);
    }

    public async setLevel(payload: ISetLevelPayload): Promise<IApiResponse<any>> {
        //Validate the level
        if (!Core200S.levels.includes(payload.level)) {
            throw new Error(`Invalid level: ${payload.level}`);
        }
        return super.setLevel(payload);
    }

    public async setPurifierMode(mode: ISetPurifierModePayload): Promise<IApiResponse<any>> {
        //Validate the mode
        if (!Core200S.modes.includes(mode.mode)) {
            throw new Error(`Invalid mode: ${mode.mode}`);
        }
        return super.setPurifierMode(mode);
    }



}