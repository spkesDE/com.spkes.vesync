import * as crypto from "crypto";
import Helper from "./lib/helper";
import VeSync from "./veSync";

export default class VeSyncDeviceBase {
    deviceRegion:string = "";
    isOwner: boolean = false;
    deviceName:string = "";
    deviceImg:string = "";
    cid:string = "";
    deviceStatus:string = "";
    connectionStatus:string = "";
    connectionType:string = "";
    deviceType:string = "";
    type:string = "";
    uuid:string = "";
    configModule:string = "";
    macID:string = "";
    mode:string = "";
    speed:string = "";
    extension: any = {};
    currentFirmVersion:string = "";
    subDeviceNo:number = 0
    deviceFirstSetupTime:string = "";
    Device_Features:{[key: string]: any} = {};
    protected api: VeSync;

    constructor(api: VeSync, device: any) {
        this.api = api;
        this.deviceRegion = device.deviceRegion;
        this.isOwner = device.isOwner;
        this.deviceName = device.deviceName;
        this.deviceImg = device.deviceImg;
        this.cid = device.cid;
        this.deviceStatus = device.deviceStatus;
        this.connectionStatus = device.connectionStatus;
        this.connectionType = device.connectionType;
        this.deviceType = device.deviceType;
        this.type = device.type;
        this.uuid = device.uuid;
        this.configModule = device.configModule;
        this.macID = device.macID;
        this.mode = device.mode;
        this.speed = device.speed;
        this.extension = device.extension;
        this.currentFirmVersion = device.currentFirmVersion;
        this.subDeviceNo = device.subDeviceNo;
        this.deviceFirstSetupTime = device.deviceFirstSetupTime;
    }

    /**
     * Use device info for string representation of class.
     */
    public toString() : string{
        return `Device Name: ${this.deviceName},\n
                 Device Type: ${this.deviceType},\n
                 SubDevice No.: ${this.subDeviceNo},\n
                 Status: ${this.deviceStatus}`
    }

    public isOn(): boolean {
        return this.deviceStatus === "on";
    }

    public isConnected(): boolean {
        return this.connectionStatus === "online";
    }

}
