import * as crypto from "crypto";
import ApiHelper from "./lib/ApiHelper";
import {ApiCalls} from "./enum/ApiCalls";
import {BodyTypes} from "./enum/BodyTypes";
import {IDevice} from "./models/IDevice";
import DeviceTypeManager from "./DeviceTypeManager";
import BasicDevice from "./lib/BasicDevice";

export default class VeSync {

    static debugMode: boolean = true;
    username: string = "";
    password: string = "";
    time_zone: string = 'Europe/Berlin';
    private token: string = "";
    private account_id: number = 0;
    private devices: BasicDevice[] = [];
    private loggedIn: boolean = false;
    private typeManager!: DeviceTypeManager;

    public async login(username: string, password: string, isHashedPassword: boolean = false): Promise<boolean> {
        this.username = username;
        this.password = isHashedPassword ? password : this.hashPassword(password);
        let response = await ApiHelper.callApi<any>(this, ApiCalls.LOGIN, 'post', ApiHelper.requestBody(this, BodyTypes.LOGIN)).catch(console.error)
        if(response === undefined) return false;
        try {
            this.account_id = response.result.accountID;
            this.token = response.result.token;
            this.loggedIn = true;
            this.typeManager = new DeviceTypeManager();
            await this.typeManager.loadDevices();
            if (VeSync.debugMode) {
                console.debug(`Account ID: ${response.result.accountID}`);
            }
            await this.getDevices();
        } catch (e) {
            return false;
        }
        return true;
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
}
