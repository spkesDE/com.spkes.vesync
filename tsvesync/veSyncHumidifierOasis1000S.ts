import Helper from "./lib/helper";
import VeSync from "./veSync";
import {ApiCalls} from "./lib/enum/apiCalls";
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
                'setHumidityMode', 'setDisplay']
        }
    }

    //endregion


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
                ...Helper.bypassBodyV2(this.api),
                cid: this.cid,
                configModule: this.configModule,
                payload: Helper.createPayload(this, 'getHumidifierStatus', {}),
            }
            Helper.callApi(this.api, ApiCalls.BYPASS_V2, 'post', body, Helper.bypassHeader())
                .then(result => {
                    try {
                        if (result.code === -11300030) {
                            this.mode = 'off'
                            this.connectionStatus = 'offline'
                            resolve(true)
                        }
                        if (!this.validResponse(result)) return reject(new Error(result.msg ?? result))
                        if (VeSync.debugMode) console.log(result.result.result)
                        this.mode = result.result.result.powerSwitch === 0 ? 'off' : 'on'
                        this.mist_virtual_level = result.result.result.virtualLevel ?? 0
                        this.mist_level = result.result.result.mistLevel ?? 0
                        this.mode = result.result.result.workMode ?? 'manual'
                        this.water_lacks = result.result.result.waterLacksState ?? false
                        this.humidity_high = result.result.result.targetHumidity < result.result.result.humidity
                        this.water_tank_lifted = result.result.result.waterTankLifted ?? false
                        this.automatic_stop_reach_target = result.result.result.autoStopState ?? true
                        this.display = result.result.result.screenState ?? false
                        this.targetHumidity = result.result.result.targetHumidity ?? 0
                        this.display = result.result.result.screenSwitch ?? false
                        this.autoStopSwitch = result.result.result.autoStopSwitch ?? true
                        this.connectionStatus = 'online'
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
                ...Helper.bypassBodyV2(this.api),
                cid: this.cid,
                configModule: this.configModule,
                payload: Helper.createPayload(this, 'setDisplay', {screenSwitch: mode ? 1 : 0}),
            }
            Helper.callApi(this.api, ApiCalls.BYPASS_V2, 'post', body, Helper.bypassHeader())
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
                ...Helper.bypassBodyV2(this.api),
                cid: this.cid,
                configModule: this.configModule,
                payload: Helper.createPayload(this, 'setHumidityMode', {workMode: mode.toLowerCase()}),
            }
            Helper.callApi(this.api, ApiCalls.BYPASS_V2, 'post', body, Helper.bypassHeader())
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
            if (!this.Device_Features.OasisMist100S.levels.includes(level)) return reject(new Error('Invalid level: ' + level))
            let body = {
                ...Helper.bypassBodyV2(this.api),
                cid: this.cid,
                configModule: this.configModule,
                payload: Helper.createPayload(this, 'setVirtualLevel', {
                    levelIdx: 0,
                    virtualLevel: level,
                    levelType: 'mist'
                }),
            }
            Helper.callApi(this.api, ApiCalls.BYPASS_V2, 'post', body, Helper.bypassHeader())
                .then(result => {
                    try {
                        if (!this.validResponse(result)) return reject(new Error(result.msg ?? result))
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
                ...Helper.bypassBodyV2(this.api),
                cid: this.cid,
                configModule: this.configModule,
                payload: Helper.createPayload(this, 'setSwitch', {
                    powerSwitch: toggle ? 1 : 0,
                    switchIdx: 0
                }),
            }
            Helper.callApi(this.api, ApiCalls.BYPASS_V2, 'post', body, Helper.bypassHeader())
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
                ...Helper.bypassBodyV2(this.api),
                cid: this.cid,
                configModule: this.configModule,
                payload: Helper.createPayload(this, 'setTargetHumidity', {targetHumidity: humidity}),
            }
            Helper.callApi(this.api, ApiCalls.BYPASS_V2, 'post', body, Helper.bypassHeader())
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
                ...Helper.bypassBodyV2(this.api),
                cid: this.cid,
                configModule: this.configModule,
                payload: Helper.createPayload(this, 'setAutoStopSwitch', {autoStopSwitch: mode ? 1 : 0}),
            }
            Helper.callApi(this.api, ApiCalls.BYPASS_V2, 'post', body, Helper.bypassHeader())
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

}
