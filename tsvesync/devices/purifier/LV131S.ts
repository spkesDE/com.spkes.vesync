import DeviceModes from "../../enum/DeviceModes";

import BasicPurifier from "../../lib/BasicPurifier";
import IApiResponse from "../../models/IApiResponse";
import ApiHelper from "../../lib/ApiHelper";
import {BodyTypes} from "../../enum/bodyTypes";
import {IGetLV131PurifierStatus} from "../../models/purifier/IGetLV131PurifierStatus";


export default class LV131S extends BasicPurifier {
    static deviceModels = ['LV-PUR131S', 'LV-RH131S'];
    static methods = ['getPurifierStatus', 'setSwitch', 'setNightLight', 'setLevel', 'setPurifierMode', 'setDisplay', 'setChildLock', 'setIndicatorLight'];
    static modes = [DeviceModes.Auto, DeviceModes.Manual, DeviceModes.Sleep];
    static levels = [1, 2, 3];
    static features = ['air_quality']

    status: IGetLV131PurifierStatus | null = null;

    public async setLevel(payload: number): Promise<IApiResponse<any>> {
        //Validate the level
        if (!LV131S.levels.includes(payload)) {
            throw new Error(`Invalid level: ${payload}`);
        }
        let body: any = {
            ...ApiHelper.requestBody(this.api, BodyTypes.DEVICE_STATUS),
            uuid: this.device.uuid,
            level: payload
        }
        return ApiHelper.callApi(this.api, "/131airPurifier/v1/device/updateSpeed", 'put', body)
    }

    public async setPurifierMode(mode: DeviceModes): Promise<IApiResponse<any>> {
        //Validate the mode
        if (!LV131S.modes.includes(mode)) {
            throw new Error(`Invalid mode: ${mode}`);
        }
        let body: any = {
            ...ApiHelper.requestBody(this.api, BodyTypes.DEVICE_STATUS),
            uuid: this.device.uuid,
            mode: mode
        }
        return ApiHelper.callApi(this.api, "/131airPurifier/v1/device/updateMode", 'put', body)
    }

    public async getPurifierStatus(): Promise<IApiResponse<IGetLV131PurifierStatus>> {
        let body: any = {
            ...ApiHelper.requestBody(this.api, BodyTypes.DEVICE_STATUS),
            uuid: this.device.uuid
        }
        const status = await ApiHelper.callApi<IGetLV131PurifierStatus>(this.api, "/131airPurifier/v1/device/deviceDetail", 'post', body)
        this.status = status.result.result;
        return status
    }

    public async setSwitch(payload: boolean): Promise<IApiResponse<any>> {
        let body: any = {
            ...ApiHelper.requestBody(this.api, BodyTypes.DEVICE_STATUS),
            uuid: this.device.uuid,
            status: payload ? "on" : "off"
        }
        return ApiHelper.callApi(this.api, "/131airPurifier/v1/device/deviceStatus", 'put', body)
    }

    public async setDisplay(payload: boolean): Promise<IApiResponse<any>> {
        let body: any = {
            ...ApiHelper.requestBody(this.api, BodyTypes.DEVICE_STATUS),
            uuid: this.device.uuid,
            status: payload ? "on" : "off"
        }
        return ApiHelper.callApi(this.api, "/131airPurifier/v1/device/updateScreen", 'put', body)
    }


}