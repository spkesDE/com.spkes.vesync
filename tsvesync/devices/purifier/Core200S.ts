import DeviceModes from "../../enum/DeviceModes";
import IApiResponse from "../../models/IApiResponse";
import BasicPurifier from "../../lib/BasicPurifier";


export default class Core200S extends BasicPurifier {
    static deviceModels = ['Core200S', 'LAP-C201S-AUSR', 'LAP-C202S-WUSR'];
    static methods = ['getPurifierStatus', 'setSwitch', 'setNightLight', 'setLevel', 'setPurifierMode', 'setDisplay', 'setChildLock', 'setIndicatorLight'];
    static features = [];
    static levels = [1, 2, 3];
    static modes = [DeviceModes.Manual, DeviceModes.Sleep, DeviceModes.Off];


    public async setLevel(payload: number): Promise<IApiResponse<any>> {
        //Validate the level
        if (!Core200S.levels.includes(payload)) {
            throw new Error(`Invalid level: ${payload}`);
        }
        return super.setLevel(payload);
    }

    public async setPurifierMode(mode: DeviceModes): Promise<IApiResponse<any>> {
        //Validate the mode
        if (!Core200S.modes.includes(mode)) {
            throw new Error(`Invalid mode: ${mode}`);
        }
        return super.setPurifierMode(mode);
    }



}