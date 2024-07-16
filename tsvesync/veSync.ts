import * as crypto from "crypto";
import Helper from "./lib/helper";
import VeSyncPurifier from "./veSyncPurifier";
import VeSyncDeviceBase from "./veSyncDeviceBase";
import VeSyncHumidifier from "./veSyncHumidifier";
import {BodyTypes} from "./lib/enum/bodyTypes";
import {ApiCalls} from "./lib/enum/apiCalls";
import VeSyncPurifierLV131 from "./veSyncPurifierLV131";
import VeSyncHumidifierOasis1000S from "./veSyncHumidifierOasis1000S.js";
import VeSyncTowerFan from "./veSyncTowerFan";

export default class VeSync {

    static debugMode: boolean = false;
    username: string = "";
    password: string = "";
    time_zone: string = 'Europe/Berlin';
    private token: string = "";
    private account_id: number = 0;
    private devices: VeSyncDeviceBase[] = [];
    private loggedIn: boolean = false;

    public async login(username: string, password: string, isHashedPassword: boolean = false): Promise<boolean> {
        this.username = username;
        this.password = isHashedPassword ? password : this.hashPassword(password);
        let response = await Helper.callApi(this, ApiCalls.LOGIN, 'post', Helper.requestBody(this, BodyTypes.LOGIN)).catch(console.error)
        try {
            this.account_id = response.result.accountID;
            this.token = response.result.token;
            this.loggedIn = true;
            if (VeSync.debugMode) {
                console.debug(`Account ID: ${response.result.accountID}`);
            }
            await this.getDevices();
        } catch (e) {
            return false;
        }
        return true;
    }

    public async getDevices(): Promise<VeSyncDeviceBase[]> {
        if (this.token === "") return [];
        this.devices = [];
        let response = await Helper.callApi(this, ApiCalls.DEVICES, 'post', Helper.requestBody(this, BodyTypes.DEVICE_LIST)).catch(console.error);
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

    private hashPassword(password: string) {
        return crypto.createHash('md5').update(password).digest('hex');
    }

    private processDevices(list: any) {
        for (let deviceRaw of list as any) {
            let device = this.getDeviceObject(deviceRaw);
            if (device === undefined) continue;
            this.devices.push(device);
        }
        if (VeSync.debugMode) console.debug("Total Devices processed: " + this.devices.length)
    }

    private getDeviceObject(deviceRaw: any): VeSyncDeviceBase | undefined {
        let devices = {
            VeSyncHumidifier: [
                'Classic300S', 'LUH-A601S-WUSB',
                'Classic200S',
                'Oasis450S',  'LUH-O451S-WUS', 'LUH-O451S-WEU',
                'Dual200S', 'LUH-D301S-WUSR', 'LUH-D301S-WJP', 'LUH-D301S-WEU',
                'LV600S', 'LUH-A602S-WUSR', 'LUH-A602S-WUS', 'LUH-A602S-WEUR', 'LUH-A602S-WEU', 'LUH-A602S-WJP'
            ],
            VeSyncPurifier: [
                'Core200S', 'LAP-C201S-AUSR', 'LAP-C202S-WUSR',
                'Core300S', 'LAP-C301S-WJP', 'LAP-C302S-WUSB',
                'Core400S', 'LAP-C401S-WJP', 'LAP-C401S-WUSR', 'LAP-C401S-WAAA',
                'Core600S', 'LAP-C601S-WUS', 'LAP-C601S-WUSR', 'LAP-C601S-WEU',
                'Vital100S', 'LAP-V102S-AASR', 'LAP-V102S-WUS', 'LAP-V102S-WEU', 'LAP-V102S-AUSR', 'LAP-V102S-WJP',
                'Vital200S', 'LAP-V201S-AASR', 'LAP-V201S-WJP', 'LAP-V201S-WEU', 'LAP-V201S-WUS', 'LAP-V201-AUSR', 'LAP-V201S-AEUR'
            ],
            VeSyncPurifierLV131: [
                'LV-PUR131S', 'LV-RH131S'
            ],
            VeSyncHumidifierOasis1000S: [
                'LUH-M101S-WUS',  'LUH-M101S-WEUR'
            ],
            VeSyncTowerFan: [
                'LTF-F422S-KEU', 'LTF-F422S-WUSR', 'LTF-F422_WJP', 'LTF-F422S-WUS'
            ]

        }

        if (devices.VeSyncHumidifier.includes(deviceRaw.deviceType))
            return new VeSyncHumidifier(this, deviceRaw);
        if (devices.VeSyncPurifier.includes(deviceRaw.deviceType))
            return new VeSyncPurifier(this, deviceRaw);
        if (devices.VeSyncPurifierLV131.includes(deviceRaw.deviceType))
            return new VeSyncPurifierLV131(this, deviceRaw);
        if (devices.VeSyncHumidifierOasis1000S.includes(deviceRaw.deviceType))
            return new VeSyncHumidifierOasis1000S(this, deviceRaw);
        if (devices.VeSyncTowerFan.includes(deviceRaw.deviceType)){
            return new VeSyncTowerFan(this, deviceRaw);
        }
        console.error("Device not supported found: " + JSON.stringify(deviceRaw));
        return new VeSyncDeviceBase(this, deviceRaw);
    }

}
