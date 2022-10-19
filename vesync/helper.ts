import http, {IncomingMessage} from "http";
import https, {RequestOptions} from "https";
import VeSync from "./veSync";

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

    //Header for the API requests
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

    private static bodyBase(api: VeSync): {} {
        return {'timeZone': api.time_zone, 'acceptLanguage': 'en'}
    }

    private static bodyAuth(api: VeSync): {} {
        return {'accountID': api.account_id, 'token': api.token}
    }

    private static bodyDetails(api: VeSync): {} {
        return {
            'appVersion': this.APP_VERSION,
            'phoneBrand': this.PHONE_BRAND,
            'phoneOS': this.PHONE_OS,
            'traceId': new Date().getTime().toString(),
        }
    }

    static requestBody(api: VeSync, type: string) : {} {
        let body = {};
        switch (type) {
            case 'login':
                body = {
                    ...this.bodyBase(api),
                    ...this.bodyDetails(api),
                    email: api.username,
                    password: api.password,
                    devToken: '',
                    userType: this.USER_TYPE,
                    method: 'login'
                }
                break;
            case 'devicelist':
                body = {
                    ...this.bodyBase(api),
                    ...this.bodyAuth(api),
                    ...this.bodyDetails(api),
                    method: 'devices',
                    pageNo: '1',
                    pageSize: '100',
                }
                break;
            case 'bypass':
                body = {
                    ...this.bodyBase(api),
                    ...this.bodyAuth(api),
                    ...this.bodyDetails(api),
                    method: 'bypass',
                }
                break;
            case 'bypassV2':
                body = {
                    ...this.bodyBase(api),
                    ...this.bodyAuth(api),
                    ...this.bodyDetails(api),
                    deviceRegion: this.DEFAULT_REGION,
                    method: 'bypassV2',
                }
                break;
        }
        return body;
    }

    public static async request(url: string, requestOptions:RequestOptions, requestBody: {}) : Promise<any> {
        return new Promise((resolve, reject) => {
            const client = require('https');
            let postData = JSON.stringify(requestBody);

            let req = client.request(url, requestOptions, (res: IncomingMessage) => {
                console.log(`STATUS of ${url}: ${res.statusCode}`);
                res.setEncoding('utf8');
                res.on('data', (chunk) => {
                    resolve(JSON.parse(chunk));
                });
                /*res.on('end', () => {
                    console.log('No more data in response.');
                });*/
            })

            req.on('error', (e: Error) => {
                console.error(e);
            });

            req.write(postData);
            req.end();
        });
    }

    static async callApi(api: VeSync, path: string, method: string, requestBody: {}, header: {} = this.buildHeaders(api)) : Promise<any> {
        let options = {
            method: method.toUpperCase(),
            headers: header
        };
        return await Helper.request(this.API_BASE_URL + path, options, requestBody);
    }

    static bypassHeader() {
        return {
            'Content-Type': 'application/json; charset=UTF-8',
            'User-Agent': 'okhttp/3.12.1',
        }
    }

    static bypassBodyV2(api: VeSync) {
        return {
            ...this.requestBody(api,'bypassV2'),
            'debugMode': false,
        }
    }
}
