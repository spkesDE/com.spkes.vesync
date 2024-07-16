import Helper from "./lib/helper";
import VeSyncDeviceBase from "./veSyncDeviceBase";
import VeSync from "./veSync";
import {ApiCalls} from "./lib/enum/apiCalls";

interface DeviceFeatures {
    models: string[],
    modes: string[],
    features: string[],
    levels: number[],
    method: string[]
}

export default class VeSyncTowerFan extends VeSyncDeviceBase {

    //region Device Features
    Device_Features: { [key: string]: DeviceFeatures } = {
        F422S: {
            models: ['LTF-F422S-KEU', 'LTF-F422S-WUSR', 'LTF-F422_WJP', 'LTF-F422S-WUS'],
            modes: ['advancedSleep', 'auto', 'turbo', 'normal'],
            features: [],
            levels: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
            method: ['getTowerFanStatus', 'setDisplay', 'setDisplayingType',
                'setLevel', 'setMuteSwitch', 'setOscillationSwitch',
                'setSleepPreference', 'setSwitch', 'setTowerFanMode']
        },
    }
    //endregion
    debugMode: boolean = true
    mode: string = "off";
    fan_level: number = 1;
    display: boolean = true;
    night_light: string = 'off';
    air_temperature: number = 0;
    oscillation_state: boolean = false;
    oscillation_switch: boolean = false;
    mute_state: boolean = false;
    mute_switch: boolean = false;

    constructor(api: VeSync, device: any) {
        super(api, device);
        this.getStatus().catch(() => {
        });
    }

    /* turn on or off the device */
    public async toggleSwitch(toggle: boolean): Promise<boolean> {
        return new Promise((resolve, reject) => {
            let body = {
                ...Helper.bypassBodyV2(this.api),
                cid: this.cid,
                configModule: this.configModule,
                payload: Helper.createPayload(this, 'setSwitch', {powerSwitch: toggle ? 1 : 0, switchIdx: 0}),
            }
            Helper.callApi(this.api, ApiCalls.BYPASS_V2, 'post', body, Helper.bypassHeader())
                .then(result => {
                    if (!this.validResponse(result)) return reject(new Error(result.msg ?? result))
                    this.enabled = toggle;
                    return resolve(this.enabled);
                })
                .catch(reject)
        });
    }

    public async on() {
        return this.toggleSwitch(true);
    }

    public async off() {
        return this.toggleSwitch(false);
    }

    /* Getting Device Status */
    public getStatus(): Promise<any> {
        return new Promise((resolve, reject) => {
            let body = {
                ...Helper.bypassBodyV2(this.api),
                cid: this.cid,
                configModule: this.configModule,
                payload: Helper.createPayload(this, 'getTowerFanStatus', {}),
            }
            Helper.callApi(this.api, ApiCalls.BYPASS_V2, 'post', body, Helper.bypassHeader())
                .then(result => {
                    /*
                        {
                          powerSwitch: 0,
                          workMode: 'advancedSleep' | 'auto' | 'turbo' | 'normal',
                          manualSpeedLevel: 5,
                          fanSpeedLevel: 0,
                          screenState: 0,
                          screenSwitch: 0,
                          oscillationSwitch: 0,
                          oscillationState: 0,
                          muteSwitch: 1,
                          muteState: 1,
                          timerRemain: 0,
                          temperature: 775,
                          errorCode: 0,
                          sleepPreference: {
                            sleepPreferenceType: 'default',
                            oscillationSwitch: 0,
                            initFanSpeedLevel: 0,
                            fallAsleepRemain: 0,
                            autoChangeFanLevelSwitch: 0
                          },
                          scheduleCount: 0,
                          displayingType: 0
                        }
                     */
                    if (VeSync.debugMode) console.log(result)
                    if (!this.validResponse(result)) return reject(new Error(result.msg ?? result))
                    this.enabled = result.result.result.powerSwitch === 1;
                    this.mode = result.result.result.workMode;
                    if(VeSync.debugMode) console.log('Mode: ' + this.mode)
                    this.fan_level = result.result.result.fanSpeedLevel;
                    if(VeSync.debugMode) console.log('manualSpeedLevel: ' + result.result.result.manualSpeedLevel)
                    this.speed = result.result.result.fanSpeedLevel;
                    if(VeSync.debugMode) console.log('fanSpeedLevel: ' + this.speed)
                    this.display = result.result.result.screenState === 1;
                    this.air_temperature = this.convertTemperature(result.result.result.temperature);
                    if(VeSync.debugMode) console.log('Temperature: ' + this.air_temperature + '°C - RAW ' + result.result.result.temperature)
                    this.oscillation_state = result.result.result.oscillationState === 1;
                    this.oscillation_switch = result.result.result.oscillationSwitch === 1;
                    this.mute_state = result.result.result.muteState === 1;
                    this.mute_switch = result.result.result.muteSwitch === 1;
                    return resolve(true);
                }).catch(reject)
        })
    }

    public async setOscillationSwitch(value: boolean): Promise<boolean> {
        return new Promise((resolve, reject) => {
            let body = {
                ...Helper.bypassBodyV2(this.api),
                cid: this.cid,
                configModule: this.configModule,
                payload: Helper.createPayload(this, 'setOscillationSwitch', {oscillationSwitch: value ? 1 : 0}),
            }
            Helper.callApi(this.api, ApiCalls.BYPASS_V2, 'post', body, Helper.bypassHeader())
                .then(result => {
                    if (!this.validResponse(result)) return reject(new Error(result.msg ?? result))
                    this.oscillation_switch = value;
                    return resolve(this.oscillation_switch);
                })
                .catch(reject)
        });
    }

    public async setMode(value: string): Promise<boolean> {
        return new Promise((resolve, reject) => {
            let body = {
                ...Helper.bypassBodyV2(this.api),
                cid: this.cid,
                configModule: this.configModule,
                payload: Helper.createPayload(this, 'setTowerFanMode', {workMode: value}),
            }
            Helper.callApi(this.api, ApiCalls.BYPASS_V2, 'post', body, Helper.bypassHeader())
                .then(result => {
                    if (!this.validResponse(result)) return reject(new Error(result.msg ?? result))
                    this.mode = value;
                    return resolve(true);
                })
                .catch(reject)
        });
    }

    public async setFanSpeed(value: number): Promise<boolean> {
        return new Promise((resolve, reject) => {
            let body = {
                ...Helper.bypassBodyV2(this.api),
                cid: this.cid,
                configModule: this.configModule,
                payload: Helper.createPayload(this, 'setLevel', {manualSpeedLevel: value, levelType: 'wind', levelIdx: 0}),
            }
            Helper.callApi(this.api, ApiCalls.BYPASS_V2, 'post', body, Helper.bypassHeader())
                .then(result => {
                    if (!this.validResponse(result)) return reject(new Error(result.msg ?? result))
                    console.log('setFanSpeed', result)
                    this.fan_level = value;
                    return resolve(true);
                })
                .catch(reject)
        });
    }

    public async setDisplay(value: boolean): Promise<boolean> {
        return new Promise((resolve, reject) => {
            let body = {
                ...Helper.bypassBodyV2(this.api),
                cid: this.cid,
                configModule: this.configModule,
                payload: Helper.createPayload(this, 'setDisplay', {screenSwitch: value ? 1 : 0}),
            }
            Helper.callApi(this.api, ApiCalls.BYPASS_V2, 'post', body, Helper.bypassHeader())
                .then(result => {
                    if (!this.validResponse(result)) return reject(new Error(result.msg ?? result))
                    this.display = value;
                    return resolve(this.display);
                })
                .catch(reject)
        });
    }

    public async setMuteSwitch(value: boolean): Promise<boolean> {
        return new Promise((resolve, reject) => {
            let body = {
                ...Helper.bypassBodyV2(this.api),
                cid: this.cid,
                configModule: this.configModule,
                payload: Helper.createPayload(this, 'setMuteSwitch', {muteSwitch: value ? 1 : 0}),
            }
            Helper.callApi(this.api, ApiCalls.BYPASS_V2, 'post', body, Helper.bypassHeader())
                .then(result => {
                    if (!this.validResponse(result)) return reject(new Error(result.msg ?? result))
                    this.mute_switch = value;
                    return resolve(this.mute_switch);
                })
                .catch(reject)
        });
    }


    /**
     * Convert temperature from raw value to Celsius. Some crazy math here. I have no idea how the raw value is calculated and how VeSync converts it to Celsius.
     * This should be a good approximation. If you have a better way to convert it, please let me know.
     * @param temperature
     * @private
     */
    private convertTemperature(temperature: number): number {
        const a = 0.0326;
        let temp = temperature * a - 0.1896;
        // Round to 1 decimal places
        return Math.round(temp * 10) / 10;
    }

}
