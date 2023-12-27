import Helper from "./lib/helper";
import VeSync from "./veSync";
import VeSyncPurifier from "./veSyncPurifier";
import {BodyTypes} from "./lib/enum/bodyTypes";

interface DeviceFeatures {
    models: string[],
    modes: string[],
    features: string[],
    levels: number[],
    method: string[]
}
export default class VeSyncPurifierLV131 extends VeSyncPurifier {

    //region Device Features
    Device_Features: { [key: string]: DeviceFeatures } = {
        LV131S: {
            models: ['LV-PUR131S', 'LV-RH131S'],
            levels: [1, 2, 3],
            features: ['air_quality'],
            modes: ['auto', 'manual', 'sleep'],
            method: ['getPurifierStatus', 'setSwitch', 'setNightLight',
                'setLevel', 'setPurifierMode', 'setDisplay',
                'setChildLock', 'setIndicatorLight']
        },
    }
    //endregion
    active_time: number = 0;
    screen_status: string = "";
    deviceStatus: string = "";
    air_quality_as_string: string = "";

    constructor(api: VeSync, device: any) {
        super(api, device);
        this.getStatus().catch();
    }

    public async toggleSwitch(toggle: boolean): Promise<boolean> {
        return new Promise((resolve, reject) => {
            let body = {
                ...Helper.requestBody(this.api, BodyTypes.DEVICE_STATUS),
                uuid: this.uuid,
                status: toggle ? "on" : "off"
            }
            Helper.callApi(this.api, "/131airPurifier/v1/device/deviceStatus", 'put', body)
                .catch(reject)
                .then(result => {
                    if (VeSync.debugMode) console.log(result);
                    if (!this.validResponse(result)) return reject(new Error(result.msg ?? result));
                    this.enabled = toggle;
                    resolve(this.enabled)
                });
        });
    }

    /* Getting Device Status */
    public getStatus(): Promise<any> {
        return new Promise((resolve, reject) => {
            let body = {
                ...Helper.requestBody(this.api, BodyTypes.DEVICE_DETAIL),
                uuid: this.uuid,
            }
            Helper.callApi(this.api, "/131airPurifier/v1/device/deviceDetail", 'post', body)
                .then(result => {
                    if (VeSync.debugMode) console.log("Raw Result: ", result);
                    if (!this.validResponse(result)) return reject(new Error(result.msg ?? result));
                    /*
                    Raw Result:  {
                          code: 0,
                          msg: 'request success',
                          traceId: '1703680340948',
                          screenStatus: 'on',
                          filterLife: { change: false, useHour: 843, percent: 79 },
                          activeTime: 669340,
                          timer: null,
                          scheduleCount: 0,
                          schedule: null,
                          levelNew: 0,
                          airQuality: 'excellent',
                          level: null,
                          mode: 'auto',
                          deviceName: 'Kitchen Air Filter',
                          currentFirmVersion: '2.0.58',
                          childLock: 'off',
                          deviceStatus: 'on',
                          deviceImg: 'https://image.vesync.com/defaultImages/deviceDefaultImages/airpurifier131_240.png',
                          connectionStatus: 'online'
                        }
                     */
                    this.active_time = result.activeTime;
                    this.screen_status = result.screenStatus;
                    this.deviceStatus = result.deviceStatus;
                    // Make first letter uppercase
                    this.air_quality_as_string = result.airQuality.charAt(0).toUpperCase() + result.airQuality.slice(1);
                    this.fan_level = result.level;
                    this.mode = result.mode;
                    this.enabled = result.deviceStatus == "on";
                    this.deviceName = result.deviceName;
                    this.deviceImg = result.deviceImg;
                    this.childLock = result.childLock;
                    this.filter_life = result.filterLife.percent;
                    this.currentFirmVersion = result.currentFirmVersion;
                    this.connectionStatus = result.connectionStatus;
                    this.connectionType = result.connectionType;
                    resolve(result);
                    return resolve(true);
                })
                .catch(reject)
        });
    }

    public async setMode(mode: string): Promise<string> {
        return new Promise((resolve, reject) => {
            if (!this.getDeviceFeatures()?.modes.includes(mode) ?? false) return reject(this.deviceType + ' don\'t accept mode: ' + mode);
            if (this.mode === mode) return;
            let body: any = {
                ...Helper.requestBody(this.api, BodyTypes.DEVICE_STATUS),
                uuid: this.uuid,
                mode: mode
            }
            if (mode == "manual") {
                body = {...body, level: 1}
            }
            Helper.callApi(this.api, "/131airPurifier/v1/device/updateMode", 'put', body)
                .then(result => {
                    if (VeSync.debugMode) console.log(result);
                    if (!this.validResponse(result)) return reject(new Error(result.msg ?? result));
                    this.mode = mode;
                    if (mode == "manual") this.fan_level = 1;
                    resolve(mode)
                })
                .catch(reject)
        });
    }

    public setFanSpeed(level: number): Promise<string | number> {
        return new Promise(async (resolve, reject) => {
            if (!this.getDeviceFeatures()?.levels.includes(level) ?? false) return reject(this.deviceType + ' don\'t accept fan level: ' + level);
            if (this.mode != "manual") await this.setMode("manual");
            if (this.fan_level == level) resolve(level)
            let body: any = {
                ...Helper.requestBody(this.api, BodyTypes.DEVICE_STATUS),
                uuid: this.uuid,
                level: level
            }
            Helper.callApi(this.api, "/131airPurifier/v1/device/updateSpeed", 'put', body)
                .then(result => {
                    if (VeSync.debugMode) console.log(result);
                    if (!this.validResponse(result)) return reject(new Error(result.msg ?? result));
                    this.fan_level = level;
                    resolve(level)
                })
                .catch(reject)
        });
    }

    public setDisplay(state: boolean): Promise<boolean | string> {
        return new Promise((resolve, reject) => {
            let body = {
                ...Helper.requestBody(this.api, BodyTypes.DEVICE_STATUS),
                uuid: this.uuid,
                status: state ? "on" : "off"
            }
            Helper.callApi(this.api, "/131airPurifier/v1/device/updateScreen", 'put', body)
                .then(result => {
                    if (VeSync.debugMode) console.log(result);
                    if (!this.validResponse(result)) return reject(new Error(result.msg ?? result));
                    this.screen_status = state ? "on" : "off";
                    resolve(state)
                })
                .catch(reject)
        });
    }


}
