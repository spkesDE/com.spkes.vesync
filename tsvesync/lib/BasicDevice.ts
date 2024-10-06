import ApiHelper from "./ApiHelper";
import {ApiCalls} from "../enum/apiCalls";
import IApiResponse from "../models/IApiResponse";
import DeviceModes from "../enum/DeviceModes";
import {IDevice} from "../models/IDevice";
import VeSync from "../VeSync";
import BasicPurifier from "./BasicPurifier";

export default class BasicDevice {
    static deviceModels: string[] = [];
    static features: string[] = [];
    static methods: string[] = [];
    static modes: DeviceModes[] = [];

    protected device: IDevice;
    protected api: VeSync;

    constructor(api: VeSync, device: IDevice) {
        this.api = api;
        this.device = device;
    }

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

    // Common API methods, will use callApi
    async post<T>(method: string, payload: any): Promise<IApiResponse<T>> {
        return this.callApi<T>(method, payload, 'post');
    }

    async get<T>(method: string, payload: any): Promise<IApiResponse<T>> {
        return this.callApi<T>(method, payload, 'get');
    }

    async put<T>(method: string, payload: any): Promise<IApiResponse<T>> {
        return this.callApi<T>(method, payload, 'put');
    }

    protected hasMethod(method: string): boolean {
        const methods = (this.constructor as typeof BasicPurifier).methods;
        return methods.includes(method);
    }

    // ApiHelper method for API calls, reduce redundancy
    protected async callApi<T>(method: string, payload: any, type: 'post' | 'get' | 'put' = 'post'): Promise<IApiResponse<T>> {
        if (!this.hasMethod(method)) {
            throw new Error(`Invalid method: ${method}`);
        }

        // Boolean conversion to integers
        for (const key in payload) {
            if (typeof payload[key] === 'boolean') {
                payload[key] = payload[key] ? 1 : 0;
            }
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