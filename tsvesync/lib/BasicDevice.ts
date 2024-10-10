import ApiHelper from "./ApiHelper";
import {ApiCalls} from "../enum/ApiCalls";
import IApiResponse from "../models/IApiResponse";
import DeviceModes from "../enum/DeviceModes";
import {IDevice} from "../models/IDevice";
import VeSync from "../VeSync";

export default class BasicDevice {

    // Static properties
    static deviceModels: string[] = [];
    static features: string[] = [];
    static methods: string[] = [];
    static modes: DeviceModes[] = [];

    // Static method checks
    static hasModel(model: string): boolean {
        return this.deviceModels.includes(model);
    }

    static hasFeature(feature: string): boolean {
        return this.features.includes(feature);
    }

    static hasMode(mode: DeviceModes | string): boolean {
        return this.modes.includes(mode as DeviceModes);
    }

    device: IDevice;
    api: VeSync;

    constructor(api: VeSync, device: IDevice) {
        this.api = api;
        this.device = device;
    }

    protected hasMethod(method: string): boolean {
        const methods = (this.constructor as typeof BasicDevice).methods;
        return methods.includes(method);
    }

    async post<T>(method: string, payload: any): Promise<IApiResponse<T>> {
        return this.callApi<T>(method, payload, 'post');
    }

    async get<T>(method: string, payload: any): Promise<IApiResponse<T>> {
        return this.callApi<T>(method, payload, 'get');
    }

    async put<T>(method: string, payload: any): Promise<IApiResponse<T>> {
        return this.callApi<T>(method, payload, 'put');
    }


    protected async callApi<T>(method: string, payload: any, type: 'post' | 'get' | 'put' = 'post'): Promise<IApiResponse<T>> {
        if (!this.hasMethod(method)) {
            throw new Error(`Invalid method: ${method}`);
        }


        // Construct API call
        const requestPayload = {
            ...ApiHelper.bypassBodyV2(this.api),
            cid: this.device.cid,
            configModule: this.device.configModule,
            payload: {
                method: method,
                source: 'APP',
                data: payload,
            }
        };

        return ApiHelper.callApi(this.api, ApiCalls.BYPASS_V2, type, requestPayload);
    }
}
