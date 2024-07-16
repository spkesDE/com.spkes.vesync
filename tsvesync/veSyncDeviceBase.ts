import VeSync from "./veSync";

export default class VeSyncDeviceBase {
    deviceRegion: string = "";
    isOwner: boolean = false;
    deviceName: string = "";
    deviceImg: string = "";
    cid: string = "";
    connectionStatus: string = "offline";
    connectionType: string = "";
    deviceType: string = "";
    type: string = "";
    uuid: string = "";
    configModule: string = "";
    macID: string = "";
    mode: string = "";
    speed: string = "";
    currentFirmVersion: string = "";
    subDeviceNo: number = 0
    deviceFirstSetupTime: string = "";
    Device_Features: { [key: string]: any } = {};
    protected api: VeSync;
    extension: any;
    childLock: string = "off";
    enabled: boolean = false;

    constructor(api: VeSync, device: any) {
        this.api = api;
        this.deviceRegion = device.deviceRegion;
        this.isOwner = device.isOwner;
        this.deviceName = device.deviceName;
        this.deviceImg = device.deviceImg;
        this.cid = device.cid;
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
    public toString(): string {
        return `Device Name: ${this.deviceName},\n
                 Device Type: ${this.deviceType},\n
                 SubDevice No.: ${this.subDeviceNo},\n
                 Status: ${this.enabled ? "Enabled" : "Disabled"}`
    }

    public isOn(): boolean {
        return this.enabled;
    }

    public isConnected(): boolean {
        return this.connectionStatus === "online";
    }

    public validResponse(result: any): boolean {
        if (!result.msg) return false;
        switch (result.msg.toLowerCase()) {
            case 'request success':
                if (this.connectionStatus != "online")
                    this.connectionStatus = "online";
                return true;
            case 'device offline':
            case 'device timeout':
                this.connectionStatus = "offline";
                return false;
            default:
                return false;
        }
    }

    public getDeviceFeatures(): { [key: string]: any } {
        for (let device in this.Device_Features) {
            let newDevice: any = this.Device_Features[device];
            if (newDevice.models.includes(this.deviceType)) {
                return newDevice
            }
        }
        new Error("Device not found for type " + this.deviceType)
        return {};
    }

}
