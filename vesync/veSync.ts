import * as crypto from "crypto";
import Helper from "./lib/helper";
import VeSyncPurifier from "./veSyncPurifier";
import VeSyncDeviceBase from "./veSyncDeviceBase";

export default class VeSync {

    private token: string = "";
    private account_id: number = 0;
    private devices: VeSyncDeviceBase[] = [];
    readonly username: string;
    readonly password: string;
    readonly debugMode: boolean;
    private time_zone: string = 'America/New_York';
    private loggedIn: boolean = false;


    constructor(username: string, password: string, isRawPassword: boolean = false, debug: boolean = true) {
        this.username = username;
        if (isRawPassword)
            this.password = this.hashPassword(password);
        else
            this.password = password;
        this.debugMode = debug;
    }

    public async login(): Promise<boolean> {
        let response = await Helper.callApi(this, ApiCalls.LOGIN, 'post', Helper.requestBody(this, BodyTypes.LOGIN))
        try {
            this.account_id = response.result.accountID;
            this.token = response.result.token;
            this.loggedIn = true;
            if (this.debugMode) {
                console.debug(`Account ID: ${response.result.accountID}`);
                console.debug(`Token ${response.result.token}`);
            }
            await this.getDevices();
        } catch (e) {
            return false;
        }
        return true;
    }

    private hashPassword(password: string) {
        return crypto.createHash('md5').update(password).digest('hex');
    }

    public async getDevices(): Promise<VeSyncDeviceBase[]> {
        if (this.token === "") return [];
        this.devices = [];
        let response = await Helper.callApi(this, ApiCalls.DEVICES, 'post', Helper.requestBody(this, BodyTypes.DEVICE_LIST));
        await this.processDevices(response.result.list);
        return this.devices;
    }

    private processDevices(list: any) {
        for (let deviceRaw of list as any) {
            //TODO Check if device is already known
            let device = this.getDeviceObject(deviceRaw);
            if (device === undefined) continue;
            this.devices.push(device);

            /*
            if(device instanceof VeSyncPurifier)
            {
                console.log("toggle on fan...");
                device.setFanSpeed(3); // working
                device.setMode('sleep'); // working
                device.setChildLock(false); // working
                device.setDisplay(true); // Working
                device.setNightLight("dim");
            }
             */
        }
        if (this.debugMode) console.debug("Total Devices processed: " + this.devices.length)
    }

    private getDeviceObject(deviceRaw: any): VeSyncDeviceBase | undefined {
        switch (deviceRaw.deviceType) {
            case 'Core200S':
            case 'Core300S':
                return new VeSyncPurifier(this, deviceRaw);
            default:
                break;
        }
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
}
