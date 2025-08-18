import * as crypto from "crypto";
import ApiHelper from "./lib/ApiHelper";
import {ApiCalls} from "./enum/ApiCalls";
import {BodyTypes} from "./enum/BodyTypes";
import {IDevice} from "./models/IDevice";
import DeviceTypeManager from "./DeviceTypeManager";
import BasicDevice from "./lib/BasicDevice";
import {AuthByPWDOrOTMModel} from "./models/AuthByPWDOrOTMModel";

export default class VeSync {

    static debugMode: boolean = true;
    username: string = "";
    region = 'US';
    password: string = "";
    time_zone: string = 'America/New_York';
    private loginTries: number = 0;
    private token: string = "";
    private account_id: number = 0;
    private countryCode: string = 'US';
    private devices: BasicDevice[] = [];
    private loggedIn: boolean = false;
    private typeManager!: DeviceTypeManager;

    public async login(username: string, password: string, isHashedPassword = false): Promise<boolean> {
        if (!username || !password) {
            throw new Error("Username and password must be specified");
        }

        this.username = username;
        this.password = isHashedPassword ? password : this.hashPassword(password);
        this.loginTries = 0; // Reset login attempts on new login

        // Step 1: request auth code
        const authBody = ApiHelper.requestBody(this, BodyTypes.LOGIN);
        let response = await ApiHelper.callApi<AuthByPWDOrOTMModel>(
            this,
            ApiCalls.LOGIN_authByPWDOrOTM,
            'post',
            authBody,
            {}
        ).catch(console.error);

        if (!response) {
            throw new Error("Login failed: no response from server");
        }
        if (response.code !== 0) {
            throw new Error(`Login failed: ${response.msg || "Unknown error"}`);
        }

        try {
            const result = response.result as AuthByPWDOrOTMModel;
            if (result.authorizeCode) {
                return await this._exchangeAuthCode(result.authorizeCode);
            }
            console.error("Login failed: authorizeCode not found in response");
            return false;
        } catch (e) {
            console.error(e);
            return false;
        }
    }

    public getRegion(): string {
        return this.region;
    }

    public async getDevices(): Promise<BasicDevice[]> {
        if (this.token === "") return [];
        this.devices = [];
        let response = await ApiHelper.callApi<any>(this, ApiCalls.DEVICES, 'post', ApiHelper.requestBody(this, BodyTypes.DEVICE_LIST)).catch(console.error);
        this.processDevices(response.result.list);
        return this.devices;
    }

    public isLoggedIn(): boolean {
        return this.loggedIn;
    }

    public getAccountID(): number {
        return this.account_id;
    }

    public getToken(): string {
        return this.token;
    }

    public getTimeZone(): string {
        return this.time_zone;
    }

    getUserCountryCode() {
        return this.countryCode;
    }

    public getStoredDevice() {
        return this.devices
    }

    public getTypeManager() {
        return this.typeManager;
    }

    private hashPassword(password: string) {
        return crypto.createHash('md5').update(password).digest('hex');
    }

    private processDevices(list: any) {
        for (let deviceRaw of list as any) {
            let device = this.getDeviceObject(deviceRaw as IDevice);
            if (device === undefined) continue;
            this.devices.push(device);
        }
        if (VeSync.debugMode) console.debug("Total Devices processed: " + this.devices.length)
    }

    private getDeviceObject(deviceRaw: IDevice): BasicDevice | undefined {
        let deviceType = this.typeManager.getDevice(deviceRaw.deviceType)
        if (deviceType === undefined) {
            console.error("Device type not found: " + deviceRaw.deviceType);
            return new BasicDevice(this, deviceRaw);
        }
        return new deviceType(this, deviceRaw);
    }

    private async _exchangeAuthCode(authCode: string, regionChangeToken?: string): Promise<boolean> {
        let loginBody = ApiHelper.requestBody(this, BodyTypes.LOGIN_TOKEN_EXCHANGE);

        loginBody = {
            ...loginBody,
            authorizeCode: authCode,
            bizToken: regionChangeToken ?? null,
            regionChange: regionChangeToken ? "last_region" : null,
        }

        const resp = await ApiHelper.callApi<any>(
            this,
            ApiCalls.LOGIN_TOKEN_EXCHANGE,
            'post',
            loginBody,
            {}
        ).catch(console.error);

        if (!resp) throw new Error("Error receiving response to login request");

        // If we got a token and account ID, we are logged in
        if (resp.code === 0 && resp.result?.token && resp.result?.accountID) {
            this.token = resp.result.token;
            this.account_id = resp.result.accountID;
            this.region = resp.result.currentRegion;
            this.countryCode = resp.result.countryCode;
            this.loggedIn = true;

            this.typeManager = new DeviceTypeManager();
            await this.typeManager.loadDevices();
            await this.getDevices();

            return true;
        }

        const errorCode = resp.code;
        const msg = resp.msg || "Unknown error";

        // handle cross-region
        if (resp.result?.bizToken && this.loginTries < 3) {
            this.region = resp.result.currentRegion;
            this.countryCode = resp.result.countryCode;
            console.warn(`Cross-region login detected. Switching to region: ${this.region}. Retrying login... (Attempt ${this.loginTries + 1}/3)`);
            // Retry login with the new region token
            this.loginTries++;
            return this._exchangeAuthCode(authCode, resp.result.bizToken);
        }

        throw new Error(`Login failed: ${msg}`);
    }
}
