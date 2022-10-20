import VeSync from "../veSync";
import {RequestOptions} from "https";
import {IncomingMessage} from "http";
import VeSyncDeviceBase from "../veSyncDeviceBase";
import VeSyncFan from "../veSyncFan";

export default class Helper {
    static API_BASE_URL = 'https://smartapi.vesync.com'
    static API_BASE_PORT = 443;
    static API_RATE_LIMIT = 30
    static API_TIMEOUT = 5

    static DEFAULT_TZ = 'America/New_York'
    static DEFAULT_REGION = 'US'

    static APP_VERSION = '2.8.6'
    static PHONE_BRAND = 'SM N9005'
    static PHONE_OS = 'Android'
    static MOBILE_ID = '1234567890123456'
    static USER_TYPE = '1'
    static BYPASS_APP_V = "VeSync 3.0.51"

    static requestBody(api: VeSync, type: BodyTypes): {} {
        switch (type) {
            case BodyTypes.LOGIN:
                return {
                    ...this.bodyBase(api),
                    ...this.bodyDetails(api),
                    email: api.username,
                    password: api.password,
                    devToken: '',
                    userType: this.USER_TYPE,
                    method: 'login'
                }
            case BodyTypes.ENERGY_YEAR:
                return {
                    ...this.bodyBase(api),
                    ...this.bodyAuth(api),
                    ...this.bodyDetails(api),
                    method: 'energyyear',
                    mobileId: this.MOBILE_ID
                }
            case BodyTypes.ENERGY_MONTH:
                return {
                    ...this.bodyBase(api),
                    ...this.bodyAuth(api),
                    ...this.bodyDetails(api),
                    method: 'energymonth',
                    mobileId: this.MOBILE_ID
                }
            case BodyTypes.ENERGY_WEEK:
                return {
                    ...this.bodyBase(api),
                    ...this.bodyAuth(api),
                    ...this.bodyDetails(api),
                    method: 'energyweek',
                    mobileId: this.MOBILE_ID
                }
            case BodyTypes.DEVICE_DETAIL:
                return {
                    ...this.bodyBase(api),
                    ...this.bodyAuth(api),
                    ...this.bodyDetails(api),
                    method: 'devicedetail',
                    mobileId: this.MOBILE_ID
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
                    ...this.bodyDetails(api),
                    method: 'devices',
                    pageNo: '1',
                    pageSize: '100',
                }
            case BodyTypes.BYPASS:
                return {
                    ...this.bodyBase(api),
                    ...this.bodyAuth(api),
                    ...this.bodyDetails(api),
                    method: 'bypass',
                }
            case BodyTypes.BYPASS_V2:
                return {
                    ...this.bodyBase(api),
                    ...this.bodyAuth(api),
                    ...this.bodyDetails(api),
                    deviceRegion: this.DEFAULT_REGION,
                    method: 'bypassV2',
                }
            case BodyTypes.BYPASS_CONFIG:
                return {
                    ...this.bodyBase(api),
                    ...this.bodyAuth(api),
                    ...this.bodyDetails(api),
                    method: 'firmwareUpdateInfo',
                }
        }
        return {};
    }


    //HTTP Client for requests
    private static async makeRequest(url: string, requestOptions: RequestOptions, requestBody: {}): Promise<any> {
        return new Promise((resolve, reject) => {
            const client = require('https');
            let postData = JSON.stringify(requestBody);

            let req = client.request(url, requestOptions, (res: IncomingMessage) => {
                if(res.statusCode != 200) console.log(`STATUS of ${url}: ${res.statusCode}`);
                res.setEncoding('utf8');
                res.on('data', (chunk) => {
                    resolve(JSON.parse(chunk));
                });
            })
            req.on('error', (e: Error) => {
                console.error(e);
            });
            req.write(postData);
            req.end();
        });
    }

    static async callApi(api: VeSync, path: string, method: string, requestBody: {}, header: {} = this.buildHeaders(api)): Promise<any> {
        let options = {
            method: method.toUpperCase(),
            headers: header
        };
        return await Helper.makeRequest(this.API_BASE_URL + path, options, requestBody);
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
            'debugMode': false,
        }
    }

    //Header for the API with accountId
    private static buildHeaders(api: VeSync): {} {
        return {
            'accept-language': 'en',
            'accountId': api.account_id,
            'appVersion': this.APP_VERSION,
            'content-type': 'application/json',
            'tk': api.token,
            'tz': api.time_zone,
        }
    }

    //Base of nearly every request
    private static bodyBase(api: VeSync): {} {
        return {'timeZone': api.time_zone, 'acceptLanguage': 'en'}
    }

    //Header with Login data
    private static bodyAuth(api: VeSync): {} {
        return {'accountID': api.account_id, 'token': api.token}
    }

    //Header Details to fake a phone
    private static bodyDetails(api: VeSync): {} {
        return {
            'appVersion': this.APP_VERSION,
            'phoneBrand': this.PHONE_BRAND,
            'phoneOS': this.PHONE_OS,
            'traceId': new Date().getTime().toString(),
        }
    }

    public static createPayload(device: VeSyncDeviceBase, method: string, data: {}) {
        if (!device.Device_Features[device.deviceType].method.includes(method) ?? false) throw Error(device.deviceType + ' don\'t accept method: ' + method)
        return {
            data: data,
            method: method,
            source: 'APP'
        }
    }
}
