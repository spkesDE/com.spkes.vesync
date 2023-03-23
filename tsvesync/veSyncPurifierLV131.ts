import Helper from "./lib/helper";
import VeSync from "./veSync";
import VeSyncPurifier from "./veSyncPurifier";
import {BodyTypes} from "./lib/enum/bodyTypes";

export default class VeSyncPurifierLV131 extends VeSyncPurifier {

    //region Device Features
    Device_Features: { [key: string]: any } = {
        'LV-PUR131S': {
            module: 'VeSyncAir131',
            models: ['LV-PUR131S', 'LV-RH131S'],
            levels: [1, 2, 3],
            features: ['air_quality'],
            method: ['getPurifierStatus', 'setSwitch', 'setNightLight',
                'setLevel', 'setPurifierMode', 'setDisplay',
                'setChildLock', 'setIndicatorLight']
        },
    }
    //endregion
    private active_time: number = 0;
    private screen_status: string = "";
    private deviceStatus: string = "";

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
                    if (VeSync.debugMode) console.log(result);
                    if (!this.validResponse(result)) return reject(new Error(result.msg ?? result));
                    this.deviceStatus = result.result.result.deviceStatus ?? "Unknown";
                    this.connectionStatus = result.result.result.connectionStatus ?? "Unknown";
                    this.active_time = result.result.result.active_time ?? 0;
                    this.filter_life = result.result.result.filterLife ?? 0;
                    this.screen_status = result.result.result.screenStatus ?? "Unknown";
                    this.mode = result.result.result.mode ?? this.mode;
                    this.fan_level = result.result.result.level ?? 0;
                    this.air_quality = result.result.result.airQuality ?? 0;
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
}
