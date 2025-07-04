import VeSync from "../VeSync";
import axios, {AxiosError} from "axios";
import {BodyTypes} from "../enum/BodyTypes";
import IApiResponse from "../models/IApiResponse";

export default class ApiHelper {
    static API_BASE_URL = 'https://smartapi.vesync.com'
    static API_BASE_PORT = 443;
    static API_RATE_LIMIT = 30
    static API_TIMEOUT = 15

    static DEFAULT_TZ = 'America/New_York'
    static DEFAULT_REGION = 'US'

    static APP_VERSION = '5.4.36'
    static PHONE_BRAND = 'SM N9005'
    static PHONE_OS = 'Android'
    static USER_TYPE = '1'
    static BYPASS_APP_V = "VeSync 5.4.36"

    static requestBody(api: VeSync, type: BodyTypes): {} {
        switch (type) {
            case BodyTypes.LOGIN:
                return {
                    ...this.bodyBase(api),
                    ...this.bodyDetails(),
                    email: api.username,
                    password: api.password,
                    method: 'login'
                }
            case BodyTypes.ENERGY_YEAR:
                return {
                    ...this.bodyBase(api),
                    ...this.bodyAuth(api),
                    ...this.bodyDetails(),
                    method: 'energyyear',
                    mobileId: this.getRandomToken(16)
                }
            case BodyTypes.ENERGY_MONTH:
                return {
                    ...this.bodyBase(api),
                    ...this.bodyAuth(api),
                    ...this.bodyDetails(),
                    method: 'energymonth',
                    mobileId: this.getRandomToken(16)
                }
            case BodyTypes.ENERGY_WEEK:
                return {
                    ...this.bodyBase(api),
                    ...this.bodyAuth(api),
                    ...this.bodyDetails(),
                    method: 'energyweek',
                    mobileId: this.getRandomToken(16)
                }
            case BodyTypes.DEVICE_DETAIL:
                return {
                    ...this.bodyBase(api),
                    ...this.bodyAuth(api),
                    ...this.bodyDetails(),
                    method: 'devicedetail',
                    mobileId: this.getRandomToken(16)
                }
            case BodyTypes.DEVICE_STATUS:
                return {
                    ...this.bodyBase(api),
                    ...this.bodyAuth(api)
                }
            case BodyTypes.DEVICE_LIST:
                return {
                    ...this.bodyBase(api),
                    ...this.bodyAuth(api),
                    ...this.bodyDetails(),
                    method: 'devices',
                    pageNo: '1',
                    pageSize: '100',
                }
            case BodyTypes.BYPASS:
                return {
                    ...this.bodyBase(api),
                    ...this.bodyAuth(api),
                    ...this.bodyDetails(),
                    method: 'bypass',
                }
            case BodyTypes.BYPASS_V2:
                return {
                    ...this.bodyBase(api),
                    ...this.bodyAuth(api),
                    ...this.bodyDetails(),
                    deviceRegion: this.DEFAULT_REGION,
                    method: 'bypassV2',
                }
            case BodyTypes.BYPASS_CONFIG:
                return {
                    ...this.bodyBase(api),
                    ...this.bodyAuth(api),
                    ...this.bodyDetails(),
                    method: 'firmwareUpdateInfo',
                }
        }
        return {};
    }

    static getRandomToken(len: number): string {
        return Math.random().toString(36).substring(2, len);
    }

    static async callApi<T>(api: VeSync, path: string, method: string, requestBody: {}, header: {} = this.buildHeaders(api)): Promise<IApiResponse<T> | any> {
        let options = {
            method: method.toUpperCase(),
            headers: header
        };
        const resp = ApiHelper.makeRequest(this.API_BASE_URL + path, options, requestBody);
        if (VeSync.debugMode) {
            console.debug(`API Request: ${method} ${this.API_BASE_URL}${path}`, requestBody, await resp);
        }
        return resp;
    }

    static bypassHeader() {
        return {
            'Content-Type': 'application/json; charset=UTF-8',
            'User-Agent': 'okhttp/3.12.1',
        }
    }

    static bypassBodyV2(api: VeSync) {
        return {
            ...this.requestBody(api, BodyTypes.BYPASS_V2),
            'debugMode': true,
        }
    }


    //HTTP Client for requests
    private static async makeRequest(url: string, requestOptions: {method: string, headers: {} }, requestBody: {}): Promise<any> {
        return new Promise((resolve, reject) => {
            axios.request({
                method: requestOptions.method,
                url: url,
                headers: requestOptions.headers,
                data: requestBody,
                timeout: this.API_TIMEOUT * 1000,
            }).then((response) => {
                resolve(response.data)
            }).catch((error) => {
                if(error instanceof AxiosError || error.isAxiosError)
                    reject(error.cause)
                reject(error)
            });
        });
    }

    //Header for the API with accountId
    private static buildHeaders(api: VeSync): {} {
        return {
            'accept-language': 'en',
            'accountId': api.getAccountID(),
            'appVersion': this.APP_VERSION,
            'content-type': 'application/json',
            'tk': api.getToken(),
            'tz': api.getTimeZone(),
        }
    }

    //Base of nearly every request
    private static bodyBase(api: VeSync): {} {
        return {'timeZone': api.getTimeZone(), 'acceptLanguage': 'en'}
    }

    //Header with Login data
    private static bodyAuth(api: VeSync): {} {
        return {'accountID': api.getAccountID(), 'token': api.getToken()}
    }

    //Header Details to fake a phone
    private static bodyDetails(): {} {
        return {
            'appVersion': this.APP_VERSION,
            'phoneBrand': this.PHONE_BRAND,
            'phoneOS': this.PHONE_OS,
            'traceId': new Date().getTime().toString(),
        }
    }
}
