import VeSync from "../VeSync";
import axios, {AxiosError} from "axios";
import {BodyTypes} from "../enum/BodyTypes";
import IApiResponse from "../models/IApiResponse";

export default class ApiHelper {
    static API_BASE_PORT = 443;
    static API_RATE_LIMIT = 30
    static API_TIMEOUT = 15

    static DEFAULT_TZ = 'America/New_York'
    static DEFAULT_REGION = 'US'

    static APP_VERSION = '5.6.60'
    static PHONE_BRAND = 'SM N9005'
    static PHONE_OS = 'Android'
    static CLIENT_TYPE = 'vesyncApp'
    static USER_TYPE = '1'
    static BYPASS_APP_V = "VeSync " + this.APP_VERSION;
    static SENSITIVE_KEYS = [
        "password",
        "email",
        "verifyEmail",
        "token",
        "bizToken",
        "authorizeCode",
        "authCode",
        "accountID",
        "macID",
        "tk",
        "cid",
        "mobileID",
    ];

    static requestBody(api: VeSync, type: BodyTypes): {} {
        const appId = this.getAppID(8);
        switch (type) {
            case BodyTypes.LOGIN:
                return {
                    email: api.username,
                    method: 'authByPWDOrOTM',
                    password: api.password,
                    acceptLanguage: 'en',
                    accountID: '',
                    authProtocolType: 'generic',
                    clientInfo: this.PHONE_BRAND,
                    clientType: this.CLIENT_TYPE,
                    clientVersion: this.BYPASS_APP_V,
                    debugMode: false,
                    osInfo: this.PHONE_OS,
                    terminalId: this.getTerminalId(),
                    timeZone: this.DEFAULT_TZ,
                    token: '',
                    userCountryCode: api.getUserCountryCode(),
                    appID: appId,
                    sourceAppID: appId,
                    traceId: this.getTraceId(),
                }
            case BodyTypes.LOGIN_TOKEN_EXCHANGE:
                return {
                    method: 'loginByAuthorizeCode4Vesync',
                    userCountryCode: api.getUserCountryCode(),
                    acceptLanguage: 'en',
                    clientInfo: this.PHONE_BRAND,
                    clientType: this.CLIENT_TYPE,
                    clientVersion: this.BYPASS_APP_V,
                    debugMode: false,
                    emailSubscriptions: false,
                    osInfo: this.PHONE_OS,
                    terminalId: this.getTerminalId(),
                    timeZone: this.DEFAULT_TZ,
                    token: api.getToken() || '',
                    traceId: this.getTraceId(),
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
    }

    static getAppID(length: number = 8): string {
        const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
        let result = "";
        for (let i = 0; i < length; i++) {
            const idx = Math.floor(Math.random() * chars.length);
            result += chars[idx];
        }
        return result;
    }

    static getTraceId(): string {
        return new Date().getTime().toString();
    }

    static getTerminalId(): string {
        return '2' + ApiHelper.getAppID(32)
    }

    static getRandomToken(len: number): string {
        return Math.random().toString(36).substring(2, len);
    }

    static getAPIBaseUrl(region: string): string {
        switch (region) {
            case 'US':
                return 'https://smartapi.vesync.com';
            case 'EU':
            default:
                return 'https://smartapi.vesync.eu';
        }
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

    static async callApi<T>(api: VeSync, path: string, method: string, requestBody: {}, header: {} = this.buildHeaders(api)): Promise<IApiResponse<T> | any> {
        let options = {
            method: method.toUpperCase(),
            headers: header
        };
        const resp = ApiHelper.makeRequest(this.getAPIBaseUrl(api.getRegion()) + path, options, requestBody);
        if (VeSync.debugMode) {
            const baseUrl = this.getAPIBaseUrl(api.getRegion());

            const logOutput = [
                "\n✨ ************** API CALL ************** ✨",
                "📩 Headers:",
                JSON.stringify(this.redactSensitive(header), null, 2),
                `📤 Request: ${method.toUpperCase()} ${baseUrl}${path}`,
                JSON.stringify(this.redactSensitive(requestBody), null, 2),
                "📥 Response:",
                JSON.stringify(this.redactSensitive(await resp), null, 2),
                "******************************************\n"
            ].join("\n");

            console.debug(logOutput);
        }
        return resp;
    }

    private static redactSensitive(obj: any): any {
        if (obj === null || obj === undefined) return obj;
        if (typeof obj !== "object") return obj;
        if (Array.isArray(obj)) return obj.map(ApiHelper.redactSensitive);

        const redacted: any = {};
        for (const [key, value] of Object.entries(obj)) {
            if (ApiHelper.SENSITIVE_KEYS.includes(key)) {
                if (typeof value === 'string') {
                    if (value.includes('@')) {
                        redacted[key] = value.replace(/(.{2}).+(@.+\..+)/, '$1**$2');
                    } else {
                        redacted[key] = value.replace(/./g, '*');
                    }
                } else if (typeof value === 'number') {
                    redacted[key] = '0'.repeat(value.toString().length);
                } else {
                    redacted[key] = '*'; // For other types, just use a single asterisk
                }
            } else {
                redacted[key] = ApiHelper.redactSensitive(value);
            }
        }
        return redacted;
    }
}
