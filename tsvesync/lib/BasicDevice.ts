
import DeviceModes from "../enum/DeviceModes";
import {ApiCalls} from "../enum/apiCalls";
import Helper from "./helper";
import VeSync from "../veSync";
import {IDevice} from "../models/IDevice";
import IApiResponse from "../models/IApiResponse";


export default class BasicDevice {
    static deviceModels: string[] = [];
    static features: string[] = [];
    static methods: string[] = [];
    static modes: DeviceModes[] = [];
    device: IDevice;
    protected api: VeSync;

    constructor(api: VeSync, device: IDevice) {
        this.api = api;
        this.device = device;
    }

    static hasModel(model: string): boolean {
        return this.deviceModels.includes(model);
    }

    static hasFeature(feature: string): boolean {
        return this.features.includes(feature);
    }

    static hasMode(mode: DeviceModes | string): boolean {
        return this.modes.includes(mode as DeviceModes);
    }

    protected hasMethod(method: string): boolean {
        return false;
    }

    post<T>(method: string, requestBody: any): Promise<IApiResponse<T>> {
        if (!this.hasMethod(method)) {
            throw new Error(`Invalid method: ${method}`);
        }

        // Convert booleans to 0 or 1
        for (const key in requestBody) {
            if (typeof requestBody[key] === 'boolean') {
                requestBody[key] = requestBody[key] ? 1 : 0;
            }
        }

        return Helper.callApi(this.api, ApiCalls.BYPASS_V2, 'post', {
            ...Helper.bypassBodyV2(this.api),
            cid: this.device.cid,
            deviceId: this.device.cid,
            configModel: this.device.configModule,
            configModule: this.device.configModule,
            payload: {
                method: method,
                source: 'APP',
                data: requestBody
            }
        });
    }

    get<T>(method: string, requestBody: any): Promise<IApiResponse<T>> {
        if (!this.hasMethod(method)) {
            throw new Error(`Invalid method: ${method}`);
        }
        return Helper.callApi(this.api, ApiCalls.BYPASS_V2, 'get', {
            ...Helper.bypassBodyV2(this.api),
            cid: this.device.cid,
            configModule: this.device.configModule,
            payload: {
                data: requestBody,
                method: method,
                source: 'APP'
            }
        });
    }

    put<T>(method: string, requestBody: any): Promise<IApiResponse<T>> {
        if (!this.hasMethod(method)) {
            throw new Error(`Invalid method: ${method}`);
        }
        return Helper.callApi(this.api, ApiCalls.BYPASS_V2, 'put', {
            ...Helper.bypassBodyV2(this.api),
            cid: this.device.cid,
            configModule: this.device.configModule,
            payload: {
                data: requestBody,
                method: method,
                source: 'APP'
            }
        });
    }

}

