import ApiHelper from "../lib/ApiHelper";
import VeSync from "../VeSync";
import {ApiCalls} from "../enum/ApiCalls";
import VeSyncHumidifier from "./veSyncHumidifier.js";

interface DeviceFeatures {
    models: string[],
    modes: string[],
    features: string[],
    levels: number[],
    warm_levels?: number[]
    method: string[]
}

export default class VeSyncHumidifierOasis1000S extends VeSyncHumidifier {

    //region Device Features
    Device_Features: { [key: string]: DeviceFeatures } = {
        OasisMist1000S: {
            models: ['LUH-M101S-WUS', 'LUH-M101S-WEUR'],
            features: [],
            modes: ['auto', 'sleep', 'manual'],
            levels: [1, 2, 3, 4, 5, 6, 7, 8, 9],
            method: ['getHumidifierStatus', 'setAutoStopSwitch',
                'setSwitch', 'setVirtualLevel', 'setTargetHumidity',
                'setHumidityMode', 'setDisplay', "setNightLightBrightness"]
        }
    }

    //endregion
    private night_light_state: boolean = false;


    constructor(api: VeSync, device: any) {
        super(api, device);
        this.getStatus().catch(() => {
        });
    }

    /**
     * Get the current status of the device
     * it uses different dict then the other devices
     */
    public async getStatus(): Promise<any> {
        return new Promise((resolve, reject) => {
            let body = {
                ...ApiHelper.bypassBodyV2(this.api),
                cid: this.cid,
                configModule: this.configModule,
                payload: ApiHelper.createPayload(this, 'getHumidifierStatus', {}),
            }
            ApiHelper.callApi(this.api, ApiCalls.BYPASS_V2, 'post', body, ApiHelper.bypassHeader())
                .then(result => {
                    try {
                        if (result.code === -11300030) {
                            this.mode = 'off'
                            this.connectionStatus = 'offline'
                            resolve(true)
                        }
                        if (!this.validResponse(result)) return reject(new Error(result.msg ?? result))
                        const payload = result.result.result;
                        if (VeSync.debugMode) console.log(payload)
                        /*
                            Result in result.result.result
                            {
                              powerSwitch: 1, +
                              humidity: 54, +
                              targetHumidity: 60, +
                              virtualLevel: 5, +
                              mistLevel: 2, +
                              workMode: 'auto', +
                              waterLacksState: 0, +
                              waterTankLifted: 0,+
                              autoStopSwitch: 1, +
                              autoStopState: 0, +
                              screenSwitch: 0, +
                              screenState: 0,
                              scheduleCount: 0,
                              timerRemain: 0,
                              errorCode: 0,
                              nightLight: { nightLightSwitch: 0, brightness: 60 } +
                            }
                         */

                        this.enabled = payload.powerSwitch === 1
                        this.humidity = payload.humidity
                        this.targetHumidity = payload.targetHumidity
                        this.mist_virtual_level = payload.virtualLevel
                        this.mist_level = payload.mistLevel
                        this.water_lacks = payload.waterLacksState === 1
                        this.water_tank_lifted = payload.waterTankLifted === 1
                        this.autoStopSwitch = payload.autoStopSwitch === 1
                        this.display = payload.screenSwitch === 1
                        this.night_light_brightness = payload.nightLight.brightness
                        this.night_light_state = payload.nightLight.nightLightSwitch === 1
                        this.connectionStatus = 'online'
                        this.mode = payload.workMode

                        // console.log(this) //TODO

                        return resolve(true)
                    } catch (e: any) {
                        return reject(result);
                    }
                })
                .catch(reject)
        });
    }

    /**
     * Set display on or off it uses payload 'screenSwitch': mode int
     */

    public async setDisplay(mode: boolean): Promise<any> {
        return new Promise((resolve, reject) => {
            let body = {
                ...ApiHelper.bypassBodyV2(this.api),
                cid: this.cid,
                configModule: this.configModule,
                payload: ApiHelper.createPayload(this, 'setDisplay', {screenSwitch: mode ? 1 : 0}),
            }
            ApiHelper.callApi(this.api, ApiCalls.BYPASS_V2, 'post', body, ApiHelper.bypassHeader())
                .then(result => {
                    try {
                        if (!this.validResponse(result)) return reject(new Error(result.msg ?? result))
                        this.display = mode
                        return resolve(true)
                    } catch (e: any) {
                        return reject(result);
                    }
                })
                .catch(reject)
        });
    }

    /**
     * Set Humidity mode it uses payload 'workMode': mode.lower()
     */
    public async setHumidityMode(mode: string): Promise<any> {
        return new Promise((resolve, reject) => {
            let body = {
                ...ApiHelper.bypassBodyV2(this.api),
                cid: this.cid,
                configModule: this.configModule,
                payload: ApiHelper.createPayload(this, 'setHumidityMode', {workMode: mode.toLowerCase()}),
            }
            ApiHelper.callApi(this.api, ApiCalls.BYPASS_V2, 'post', body, ApiHelper.bypassHeader())
                .then(result => {
                    try {
                        if (!this.validResponse(result)) return reject(new Error(result.msg ?? result))
                        this.mode = mode
                        return resolve(true)
                    } catch (e: any) {
                        return reject(result);
                    }
                })
                .catch(reject)
        });
    }

    /**
     * Set Sleep mode
     */

    public async setSleepMode(): Promise<any> {
        return this.setHumidityMode('sleep')
    }

    /**
     * Set Auto mode
     */

    public async setAutoMode(): Promise<any> {
        return this.setHumidityMode('auto')
    }

    /**
     * Set Mist Level
     * Payload: {
     *             'levelIdx': 0,
     *             'virtualLevel': level,
     *             'levelType': 'mist'
     *         }
     */
    public async setMistLevel(level: number): Promise<any> {
        return new Promise((resolve, reject) => {
            // Validate level
            if (!this.Device_Features.OasisMist1000S.levels.includes(level)) return reject(new Error('Invalid level: ' + level))
            let body = {
                ...ApiHelper.bypassBodyV2(this.api),
                cid: this.cid,
                configModule: this.configModule,
                payload: ApiHelper.createPayload(this, 'setVirtualLevel', {
                    levelIdx: 0,
                    virtualLevel: level,
                    levelType: 'mist'
                }),
            }
            ApiHelper.callApi(this.api, ApiCalls.BYPASS_V2, 'post', body, ApiHelper.bypassHeader())
                .then(result => {
                    try {
                        if (!this.validResponse(result)) return reject(new Error(result.msg ?? result))
                        if (VeSync.debugMode) console.log(result)
                        this.mist_virtual_level = level
                        return resolve(true)
                    } catch (e: any) {
                        return reject(result);
                    }
                })
                .catch(reject)
        });
    }

    /**
     * Toggle switch on or off
     * Payload: {
     *                 'powerSwitch': int(toggle),
     *                 'switchIdx': 0
     *             },
     */
    public async toggleSwitch(toggle: boolean): Promise<any> {
        return new Promise((resolve, reject) => {
            let body = {
                ...ApiHelper.bypassBodyV2(this.api),
                cid: this.cid,
                configModule: this.configModule,
                payload: ApiHelper.createPayload(this, 'setSwitch', {
                    powerSwitch: toggle ? 1 : 0,
                    switchIdx: 0
                }),
            }
            ApiHelper.callApi(this.api, ApiCalls.BYPASS_V2, 'post', body, ApiHelper.bypassHeader())
                .then(result => {
                    try {
                        if (!this.validResponse(result)) return reject(new Error(result.msg ?? result))
                        this.mode = toggle ? 'on' : 'off'
                        return resolve(true)
                    } catch (e: any) {
                        return reject(result);
                    }
                })
                .catch(reject)
        });
    }

    /**
     * Turn on
     */
    public async on(): Promise<any> {
        return this.toggleSwitch(true)
    }

    /**
     * Turn off
     */
    public async off(): Promise<any> {
        return this.toggleSwitch(false)
    }

    /**
     * Set target humidity
     * Payload: {
     *             'targetHumidity': humidity',
     *         }
     */
    public async setTargetHumidity(humidity: number): Promise<any> {
        return new Promise((resolve, reject) => {
            // Validate humidity between 30 and 80
            if (humidity < 30 || humidity > 80) return reject(new Error('Invalid humidity: ' + humidity))
            let body = {
                ...ApiHelper.bypassBodyV2(this.api),
                cid: this.cid,
                configModule: this.configModule,
                payload: ApiHelper.createPayload(this, 'setTargetHumidity', {targetHumidity: humidity}),
            }
            ApiHelper.callApi(this.api, ApiCalls.BYPASS_V2, 'post', body, ApiHelper.bypassHeader())
                .then(result => {
                    try {
                        if (!this.validResponse(result)) return reject(new Error(result.msg ?? result))
                        this.targetHumidity = humidity
                        return resolve(true)
                    } catch (e: any) {
                        return reject(result);
                    }
                })
                .catch(reject)
        });
    }

    /**
     * Set Auto Stop Switch
     * Payload: {
     *             'autoStopSwitch': int(mode)
     *         }
     */
    public async setAutoStopSwitch(mode: boolean): Promise<any> {
        return new Promise((resolve, reject) => {
            let body = {
                ...ApiHelper.bypassBodyV2(this.api),
                cid: this.cid,
                configModule: this.configModule,
                payload: ApiHelper.createPayload(this, 'setAutoStopSwitch', {autoStopSwitch: mode ? 1 : 0}),
            }
            ApiHelper.callApi(this.api, ApiCalls.BYPASS_V2, 'post', body, ApiHelper.bypassHeader())
                .then(result => {
                    try {
                        if (!this.validResponse(result)) return reject(new Error(result.msg ?? result))
                        this.autoStopSwitch = mode
                        return resolve(true)
                    } catch (e: any) {
                        return reject(result);
                    }
                })
                .catch(reject)
        });
    }

    /**
     * Set Night Light Brightness
     * Payload: {
     *             'brightness': int(brightness)
     *         }
     *
     *         //TODO Not working!
     */
    public async setNightLightBrightness(brightness: number): Promise<any> {
        return new Promise((resolve, reject) => {
            // Validate brightness
            if (brightness < 0 || brightness > 100) return reject(new Error('Invalid brightness: ' + brightness))
            let body = {
                ...ApiHelper.bypassBodyV2(this.api),
                cid: this.cid,
                configModule: this.configModule,
                payload: ApiHelper.createPayload(this, 'setNightLightBrightness', {
                    nightLightBrightness: brightness
                }),
            }
            ApiHelper.callApi(this.api, ApiCalls.BYPASS_V2, 'post', body, ApiHelper.bypassHeader())
                .then(result => {
                    try {
                        if (!this.validResponse(result)) return reject(new Error(result.msg ?? result))
                        if (VeSync.debugMode) console.log(result)
                        this.night_light_brightness = brightness
                        return resolve(true)
                    } catch (e: any) {
                        return reject(result);
                    }
                })
                .catch(reject)
        });
    }

    //Overwrite for validResponse
    public validResponse(result: any) {
        const resultResponse = super.validResponse(result);
        if (VeSync.debugMode && !resultResponse) console.log('Invalid response: ' + JSON.stringify(result))
        return resultResponse;
    }
}
