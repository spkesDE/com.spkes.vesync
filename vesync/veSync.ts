import * as crypto from "crypto";
import Helper from "./lib/helper";
import VeSyncFan from "./veSyncFan";
import VeSyncDeviceBase from "./veSyncDeviceBase";

export default class VeSync {

    token: string = "";
    account_id: number = 0;
    private devices: VeSyncDeviceBase[] = [];

    set api_rate_limit(value: number) {
        if (value > 0)
            this._api_rate_limit = value;
    }

    username: string;
    password: string;
    debugMode: boolean;
    time_zone: string;
    private _api_rate_limit: number = 30;


    constructor(username: string, password: string, time_zone: string = 'America/New_York', debug: boolean = false) {
        this.username = username;
        this.password = this.hashPassword(password);
        this.time_zone = time_zone;
        this.debugMode = debug;
    }

    public async login(): Promise<boolean> {
        let response = await Helper.callApi(this, ApiCalls.LOGIN, 'post', Helper.requestBody(this, BodyTypes.LOGIN))
        if (this.debugMode) {
            console.debug(`Account ID: ${response.result.accountID}`);
            console.debug(`Token ${response.result.token}`);
        }
        this.account_id = response.result.accountID;
        this.token = response.result.token;
        return false;
    }

    private hashPassword(password: string) {
        return crypto.createHash('md5').update(password).digest('hex');
    }

    public async getDevices() {
        if (this.token === "") return;
        let response = await Helper.callApi(this, ApiCalls.DEVICES, 'post', Helper.requestBody(this, BodyTypes.DEVICE_LIST));
        this.processDevices(response.result.list);
    }

    private processDevices(list: any) {
        for (let deviceRaw of list as any) {
            let device = new VeSyncFan(this, deviceRaw);
            this.devices.push(device);
            console.log(device.toString())
            console.log(device.extension)
            console.log(deviceRaw)

            console.log("toggle on fan...")
            device.toggleSwitch(false);
            this.devices.push(device);
        }
    }

}
