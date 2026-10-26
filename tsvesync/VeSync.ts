import * as crypto from "crypto";
import ApiHelper from "./lib/ApiHelper";
import {ApiCalls} from "./enum/ApiCalls";
import {BodyTypes} from "./enum/BodyTypes";
import {IDevice} from "./models/IDevice";
import DeviceTypeManager from "./DeviceTypeManager";
import BasicDevice from "./lib/BasicDevice";
import {AuthByPWDOrOTMModel} from "./models/AuthByPWDOrOTMModel";
import {getErrorMessage} from "../lib/utils/error";

export interface IUnsupportedDeviceInfo {
    deviceType: string;
    type: string;
    configModule: string;
    connectionType: string;
    connectionStatus: string | null;
    deviceStatus: string | null;
    deviceRegion: string;
}

/** VeSync rejected the credentials (as opposed to a network or server problem). */
export class VeSyncLoginError extends Error {}

export default class VeSync {

    private static readonly ACCOUNT_LOCKED_CODE = -11247129;
    private static readonly ACCOUNT_LOCK_BUFFER_IN_SEC = 60;
    private static readonly REAUTHENTICATION_COOLDOWN_MS = 1000 * 60 * 5;

    static debugMode: boolean = false;
    private static ignoredDeviceTypes = ['CAF-R901-AEU/AUK'];
    username: string = "";
    region = 'US';
    password: string = "";
    time_zone: string = 'America/New_York';
    private loginTries: number = 0;
    private token: string = "";
    private account_id: number = 0;
    private countryCode: string = 'US';
    private devices: BasicDevice[] = [];
    private unsupportedDevices: Map<string, IUnsupportedDeviceInfo> = new Map();
    private loggedUnsupportedDeviceTypes: Set<string> = new Set();
    private loggedIn: boolean = false;
    private typeManager!: DeviceTypeManager;
    private loginLockedUntil = 0;
    private loginLockedUsername = "";
    private lastDeviceRefresh = 0;
    private deviceRefresh: Promise<BasicDevice[]> | null = null;
    private lastReauthentication = 0;
    private reauthenticating = false;

    public async login(username: string, password: string, isHashedPassword = false): Promise<boolean> {
        if (!username || !password) {
            throw new Error("Username and password must be specified");
        }

        this.throwIfLoginIsTemporarilyLocked(username);

        // Keep the current credentials if the new ones are rejected, so an
        // active session and later re-logins keep working
        const previousUsername = this.username;
        const previousPassword = this.password;
        this.username = username;
        this.password = isHashedPassword ? password : this.hashPassword(password);
        this.loginTries = 0; // Reset login attempts on new login

        const restoreCredentials = () => {
            this.username = previousUsername;
            this.password = previousPassword;
        };
        try {
            const success = await this.authenticate(username);
            if (!success) restoreCredentials();
            return success;
        } catch (error) {
            restoreCredentials();
            throw error;
        }
    }

    /**
     * Logs in again with the stored credentials after VeSync rejected the
     * token. Attempts are limited to one per few minutes so a persistent
     * error cannot lock the account. If VeSync rejects the credentials, the
     * session is marked as logged out so the devices ask for a repair.
     */
    public async reauthenticate(): Promise<boolean> {
        if (!this.loggedIn || this.reauthenticating) return false;
        if (Date.now() - this.lastReauthentication < VeSync.REAUTHENTICATION_COOLDOWN_MS) return false;

        this.reauthenticating = true;
        this.lastReauthentication = Date.now();
        console.warn("VeSync rejected the session token. Logging in again...");
        try {
            const success = await this.login(this.username, this.password, true);
            if (!success) console.error("Logging in again failed");
            return success;
        } catch (error) {
            console.error("Logging in again failed: " + getErrorMessage(error));
            if (error instanceof VeSyncLoginError) this.loggedIn = false;
            return false;
        } finally {
            this.reauthenticating = false;
        }
    }

    private async authenticate(username: string): Promise<boolean> {
        // Step 1: request auth code
        const authBody = ApiHelper.requestBody(this, BodyTypes.LOGIN);
        let response = await ApiHelper.callApi<AuthByPWDOrOTMModel>(
            this,
            ApiCalls.LOGIN_authByPWDOrOTM,
            'post',
            authBody,
            {}
        ).catch((error: unknown) => {
            console.error("Login request failed: " + getErrorMessage(error));
        });

        if (!response) {
            throw new Error("Login failed: no response from server");
        }
        if (response.code !== 0) {
            this.rememberAccountLock(username, response);
            throw new VeSyncLoginError(`Login failed: ${this.describeLoginFailure(response)}`);
        }

        try {
            const result = response.result as AuthByPWDOrOTMModel;
            if (result.authorizeCode) {
                return await this._exchangeAuthCode(result.authorizeCode);
            }
            console.error("Login failed: authorizeCode not found in response");
            return false;
        } catch (e) {
            console.error("Login failed: " + getErrorMessage(e));
            return false;
        }
    }

    public getRegion(): string {
        return this.region;
    }

    public async getDevices(): Promise<BasicDevice[]> {
        if (this.token === "") return [];
        const response = await ApiHelper.callApi<any>(this, ApiCalls.DEVICES, 'post', ApiHelper.requestBody(this, BodyTypes.DEVICE_LIST));
        if (!Array.isArray(response?.result?.list)) {
            throw new Error(`Could not load device list: ${response?.msg || "Invalid response from server"}`);
        }
        this.devices = this.processDevices(response.result.list);
        this.lastDeviceRefresh = Date.now();
        return this.devices;
    }

    /**
     * Reloads the device list unless it was loaded within maxAgeMs. Concurrent
     * callers share one request, so many Homey devices looking for a missing
     * VeSync device only cause a single API call.
     */
    public async refreshDevices(maxAgeMs = 1000 * 60): Promise<BasicDevice[]> {
        if (Date.now() - this.lastDeviceRefresh < maxAgeMs) return this.devices;
        if (!this.deviceRefresh) {
            this.deviceRefresh = this.getDevices().finally(() => {
                this.deviceRefresh = null;
            });
        }
        return this.deviceRefresh;
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

    public getUnsupportedDevices(): IUnsupportedDeviceInfo[] {
        return Array.from(this.unsupportedDevices.values());
    }

    public getDiagnosticReport(): string {
        const storedDevices = this.devices.map(device => ({
            deviceType: device.device.deviceType,
            type: device.device.type,
            configModule: device.device.configModule,
            connectionType: device.device.connectionType,
            connectionStatus: device.device.connectionStatus,
            deviceStatus: device.device.deviceStatus,
            deviceRegion: device.device.deviceRegion,
            adapter: device.constructor.name,
        }));

        return JSON.stringify({
            region: this.region,
            countryCode: this.countryCode,
            loggedIn: this.loggedIn,
            supportedDevices: storedDevices,
            unsupportedDevices: this.getUnsupportedDevices(),
            ignoredDeviceTypes: VeSync.ignoredDeviceTypes,
        }, null, 2);
    }

    public getTypeManager() {
        return this.typeManager;
    }

    private hashPassword(password: string) {
        return crypto.createHash('md5').update(password).digest('hex');
    }

    private processDevices(list: any[]): BasicDevice[] {
        this.unsupportedDevices.clear();
        const devices: BasicDevice[] = [];
        for (let deviceRaw of list) {
            let device = this.getDeviceObject(deviceRaw as IDevice);
            if (device === undefined) continue;
            devices.push(device);
        }
        if (VeSync.debugMode) console.debug("Total Devices processed: " + devices.length)
        return devices;
    }

    private getDeviceObject(deviceRaw: IDevice): BasicDevice | undefined {
        if (VeSync.ignoredDeviceTypes.includes(deviceRaw.deviceType)) {
            if (VeSync.debugMode) console.debug("Ignoring unsupported virtual device type: " + deviceRaw.deviceType);
            return undefined;
        }

        let deviceType = this.typeManager.getDevice(deviceRaw.deviceType)
        if (deviceType === undefined) {
            this.registerUnsupportedDevice(deviceRaw);
            return undefined;
        }
        return new deviceType(this, deviceRaw);
    }

    private registerUnsupportedDevice(deviceRaw: IDevice) {
        const unsupportedDevice = {
            deviceType: deviceRaw.deviceType,
            type: deviceRaw.type,
            configModule: deviceRaw.configModule,
            connectionType: deviceRaw.connectionType,
            connectionStatus: deviceRaw.connectionStatus,
            deviceStatus: deviceRaw.deviceStatus,
            deviceRegion: deviceRaw.deviceRegion,
        };

        this.unsupportedDevices.set(deviceRaw.deviceType, unsupportedDevice);
        if (this.loggedUnsupportedDeviceTypes.has(deviceRaw.deviceType)) return;

        this.loggedUnsupportedDeviceTypes.add(deviceRaw.deviceType);
        console.warn("Unsupported VeSync device discovered: " + JSON.stringify(unsupportedDevice));
    }

    private async _exchangeAuthCode(authCode: string, regionChangeToken?: string): Promise<boolean> {
        let loginBody = ApiHelper.requestBody(this, BodyTypes.LOGIN_TOKEN_EXCHANGE);

        loginBody = {
            ...loginBody,
            authorizeCode: authCode,
            bizToken: regionChangeToken ?? null,
            regionChange: regionChangeToken ? "lastRegion" : null,
        }

        const resp = await ApiHelper.callApi<any>(
            this,
            ApiCalls.LOGIN_TOKEN_EXCHANGE,
            'post',
            loginBody,
            {}
        ).catch((error: unknown) => {
            console.error("Token exchange request failed: " + getErrorMessage(error));
        });

        if (!resp) throw new Error("Error receiving response to login request");

        // If we got a token and account ID, we are logged in
        if (resp.code === 0 && resp.result?.token && resp.result?.accountID) {
            this.token = resp.result.token;
            this.account_id = resp.result.accountID;
            this.region = resp.result.currentRegion;
            this.countryCode = resp.result.countryCode;
            this.loggedIn = true;
            this.loginLockedUntil = 0;
            this.loginLockedUsername = "";

            this.typeManager = new DeviceTypeManager();
            await this.typeManager.loadDevices();
            await this.getDevices().catch((error: unknown) => {
                console.error("Logged in, but loading devices failed: " + getErrorMessage(error));
            });

            return true;
        }

        const errorCode = resp.code;
        const msg = resp.msg || "Unknown error";

        // handle cross-region
        // The auth code is only valid on the server that issued it, so the retry
        // must not switch the API region; that happens after a successful login
        if (resp.result?.bizToken && this.loginTries < 3) {
            this.countryCode = resp.result.countryCode;
            console.warn(`Cross-region login detected. Account region: ${resp.result.currentRegion}. Retrying login... (Attempt ${this.loginTries + 1}/3)`);
            // Retry login with the new region token
            this.loginTries++;
            return this._exchangeAuthCode(authCode, resp.result.bizToken);
        }

        throw new Error(`Login failed: ${msg}`);
    }

    private describeLoginFailure(response: { code?: number; msg?: string; result?: Partial<AuthByPWDOrOTMModel> }): string {
        const msg = response.msg || "Unknown error";

        if (response.code !== VeSync.ACCOUNT_LOCKED_CODE) {
            return msg;
        }

        const lockTimeInSec = this.getBufferedAccountLockTimeInSec(response);
        if (lockTimeInSec === null) {
            return `${msg}. Please wait before trying again.`;
        }

        const lockTimeInMin = Math.ceil(lockTimeInSec / 60);
        return `${msg}. Please wait about ${lockTimeInMin} minute${lockTimeInMin === 1 ? "" : "s"} before trying again.`;
    }

    private rememberAccountLock(username: string, response: { code?: number; result?: Partial<AuthByPWDOrOTMModel> }): void {
        if (response.code !== VeSync.ACCOUNT_LOCKED_CODE) {
            return;
        }

        const lockTimeInSec = this.getBufferedAccountLockTimeInSec(response);
        if (lockTimeInSec === null) {
            return;
        }

        this.loginLockedUsername = username;
        this.loginLockedUntil = Date.now() + lockTimeInSec * 1000;
    }

    private throwIfLoginIsTemporarilyLocked(username: string): void {
        if (this.loginLockedUsername !== username || Date.now() >= this.loginLockedUntil) {
            return;
        }

        const remainingSeconds = Math.ceil((this.loginLockedUntil - Date.now()) / 1000);
        const remainingMinutes = Math.ceil(remainingSeconds / 60);
        throw new Error(`Login failed: the account has been locked. Please wait about ${remainingMinutes} minute${remainingMinutes === 1 ? "" : "s"} before trying again.`);
    }

    private getBufferedAccountLockTimeInSec(response: { result?: Partial<AuthByPWDOrOTMModel> }): number | null {
        const lockTimeInSec = response.result?.accountLockTimeInSec;
        if (typeof lockTimeInSec !== "number" || !Number.isFinite(lockTimeInSec) || lockTimeInSec <= 0) {
            return null;
        }

        return lockTimeInSec + VeSync.ACCOUNT_LOCK_BUFFER_IN_SEC;
    }
}
