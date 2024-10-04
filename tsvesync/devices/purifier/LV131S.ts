
import DeviceModes from "../../enum/DeviceModes";

import BasicPurifier from "../../lib/BasicPurifier";
import ISetLevelPayload from "../../models/purifier/ISetLevelPayload";
import IApiResponse from "../../models/IApiResponse";
import ISetPurifierModePayload from "../../models/purifier/ISetPurifierModePayload";
import Helper from "../../lib/helper";
import {ApiCalls} from "../../enum/apiCalls";
import {BodyTypes} from "../../enum/bodyTypes";
import VeSync from "../../veSync";
import IGetPurifierStatus from "../../models/purifier/IGetPurifierStatus";
import {IGetLV131PurifierStatus} from "../../models/purifier/IGetLV131PurifierStatus";
import BasicDevice from "../../lib/BasicDevice";
import ISetSwitchPayload from "../../models/purifier/ISetSwitchPayload";
import ISetDisplayPayload from "../../models/purifier/ISetDisplayPayload";


export default class LV131S extends BasicPurifier {
    static deviceModels = ['LV-PUR131S', 'LV-RH131S'];
    static methods = ['getPurifierStatus', 'setSwitch', 'setNightLight', 'setLevel', 'setPurifierMode', 'setDisplay', 'setChildLock', 'setIndicatorLight'];
    static modes = [DeviceModes.Auto, DeviceModes.Manual, DeviceModes.Sleep];
    static levels = [1, 2, 3];
    static features = ['air_quality']

    status: IGetLV131PurifierStatus | null = null;

    protected hasMethod(method: string): boolean {
        return LV131S.methods.includes(method);
    }

    public async setLevel(payload: ISetLevelPayload): Promise<IApiResponse<any>> {
        //Validate the level
        if (!LV131S.levels.includes(payload.level)) {
            throw new Error(`Invalid level: ${payload.level}`);
        }
        let body: any = {
            ...Helper.requestBody(this.api, BodyTypes.DEVICE_STATUS),
            uuid: this.device.uuid,
            level: payload.level
        }
        return Helper.callApi(this.api, "/131airPurifier/v1/device/updateSpeed", 'put', body)
    }

    public async setPurifierMode(mode: ISetPurifierModePayload): Promise<IApiResponse<any>> {
        //Validate the mode
        if (!LV131S.modes.includes(mode.mode)) {
            throw new Error(`Invalid mode: ${mode.mode}`);
        }
        let body: any = {
            ...Helper.requestBody(this.api, BodyTypes.DEVICE_STATUS),
            uuid: this.device.uuid,
            mode: mode.mode
        }
        return Helper.callApi(this.api, "/131airPurifier/v1/device/updateMode", 'put', body)
    }

    public async getPurifierStatus(): Promise<IApiResponse<IGetLV131PurifierStatus>> {
        let body: any = {
            ...Helper.requestBody(this.api, BodyTypes.DEVICE_STATUS),
            uuid: this.device.uuid
        }
        const status = await Helper.callApi<IGetLV131PurifierStatus>(this.api, "/131airPurifier/v1/device/deviceDetail", 'post', body)
        this.status = status.result.result;
        return status
    }

    public async setSwitch(payload: ISetSwitchPayload): Promise<IApiResponse<any>> {
        let body: any = {
            ...Helper.requestBody(this.api, BodyTypes.DEVICE_STATUS),
            uuid: this.device.uuid,
            status: payload.enabled ? "on" : "off"
        }
        return Helper.callApi(this.api, "/131airPurifier/v1/device/deviceStatus", 'put', body)
    }

    public async setDisplay(payload: ISetDisplayPayload): Promise<IApiResponse<any>> {
        let body: any = {
            ...Helper.requestBody(this.api, BodyTypes.DEVICE_STATUS),
            uuid: this.device.uuid,
            status: payload.status ? "on" : "off"
        }
        return Helper.callApi(this.api, "/131airPurifier/v1/device/updateScreen", 'put', body)
    }


}