import Helper from "./lib/helper";
import VeSyncDeviceBase from "./veSyncDeviceBase";
import VeSync from "./veSync";

export default class VeSyncHumidifier extends VeSyncDeviceBase {

    //region Device Features
    Device_Features: { [key: string]: any } = {
        'Classic300S': {
            module: 'VeSyncHumid200300S',
            models: ['Classic300S', 'LUH-A601S-WUSB'],
            features: ['nightlight'],
            mist_modes: ['auto', 'sleep', 'manual'],
            mist_levels: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
            method: ['getHumidifierStatus', 'setAutomaticStop',
                'setSwitch', 'setNightLightBrightness',
                'setVirtualLevel', 'setTargetHumidity',
                'setHumidityMode', 'setDisplay', 'setLevel']
        },
        'Classic200S': {
            module: 'VeSyncHumid200S',
            models: ['Classic200S'],
            features: [],
            mist_modes: ['auto', 'manual'],
            mist_levels: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
            method: ['getHumidifierStatus', 'setAutomaticStop',
                'setSwitch', 'setVirtualLevel', 'setTargetHumidity',
                'setHumidityMode', 'setIndicatorLightSwitch']
        },
        'Dual200S': {
            module: 'VeSyncHumid200300S',
            models: ['Dual200S',
                'LUH-D301S-WUSR',
                'LUH-D301S-WJP',
                'LUH-D301S-WEU'],
            features: [],
            mist_modes: ['auto', 'manual'],
            mist_levels: [1, 2, 3],
            method: ['getHumidifierStatus', 'setAutomaticStop',
                'setSwitch', 'setNightLightBrightness',
                'setVirtualLevel', 'setTargetHumidity',
                'setHumidityMode', 'setDisplay', 'setLevel']
        },
        'LV600S': {
            module: 'VeSyncHumid200300S',
            models: ['LUH-A602S-WUSR',
                'LUH-A602S-WUS',
                'LUH-A602S-WEUR',
                'LUH-A602S-WEU',
                'LUH-A602S-WJP'],
            features: ['warm_mist', 'nightlight'],
            mist_modes: ['humidity', 'sleep', 'manual'],
            mist_levels: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
            warm_mist_levels: [0, 1, 2, 3],
            method: ['getHumidifierStatus', 'setSwitch', 'setNightLight',
                'setLevel', 'setHumidityMode', 'setDisplay',
                'setChildLock', 'setIndicatorLight']
        },
    }
    //endregion

    enabled: boolean = false;
    filter_life: number = 100;
    mode: string = "off";
    display: boolean = false;
    warm_mist_enabled: boolean = false;
    humidity: number = 0;
    mist_virtual_level: number = 0;
    mist_level: number = 0;
    water_lacks: boolean = false;
    humidity_high: boolean = false;
    water_tank_lifted: boolean = false;
    automatic_stop_reach_target: boolean = true;
    night_light_brightness: number = 0;
    warm_mist_level: number = 0;

    constructor(api: VeSync, device: any) {
        super(api, device);
        this.getStatus().catch(console.log);
    }

    /* turn on or off the device */
    public async toggleSwitch(toggle: boolean): Promise<string> {
        return new Promise((resolve, reject) => {
            let body = {
                ...Helper.bypassBodyV2(this.api),
                cid: this.cid,
                configModule: this.configModule,
                payload: Helper.createPayload(this, 'setSwitch', {enabled: toggle, id: 0}),
            }
            let result = Helper.callApi(this.api,
                ApiCalls.BYPASS_V2,
                'post', body, Helper.bypassHeader());
            result.then(result => {
                if (result.msg !== 'request success') {
                    console.log(result)
                    reject(result.msg)
                } else {
                    this.deviceStatus = toggle ? 'on' : "off";
                    resolve(this.deviceStatus);
                }
            });
        });
    }

    public async on() {
        return await this.toggleSwitch(true);
    }

    public async off() {
        return await this.toggleSwitch(false);
    }

    /* Set mode to manual or sleep or auto */
    public async setHumidityMode(mode: string): Promise<string> {
        return new Promise((resolve, reject) => {
            if (!this.Device_Features[this.deviceType].mist_modes.includes(mode) ?? false) reject(this.deviceType + ' don\'t accept mist modes: ' + mode);
            if (this.mode === mode) return;
            let body = {
                ...Helper.bypassBodyV2(this.api),
                cid: this.cid,
                configModule: this.configModule,
                payload: Helper.createPayload(this, 'setHumidityMode', {mode: mode.toLowerCase()}),
            }
            let result = Helper.callApi(this.api,
                ApiCalls.BYPASS_V2,
                'post', body, Helper.bypassHeader());
            result.then(result => {
                if (result.msg !== 'request success') {
                    console.log(result)
                    reject(result.msg)
                } else {
                    this.mode = mode;
                    resolve(mode);
                }
            });
        });
    }

    /* Set setNightLightBrightness. */
    public setNightLightBrightness(brightness: number): Promise<string | boolean> {
        return new Promise((resolve, reject) => {
            if (!this.Device_Features[this.deviceType].features.includes('nightlight') ?? false) reject(this.deviceType + ' don\'t accept nightlight');
            if (brightness > 0 || brightness < 100) reject("Brightness value must be set between 0 and 100");
            let body = {
                ...Helper.bypassBodyV2(this.api),
                cid: this.cid,
                configModule: this.configModule,
                payload: Helper.createPayload(this, 'setNightLightBrightness', {night_light_brightness: brightness}),
            }
            let result = Helper.callApi(this.api,
                ApiCalls.BYPASS_V2,
                'post', body, Helper.bypassHeader());
            result.then(result => {
                if (result.msg !== 'request success') {
                    console.log(result)
                    reject(result.msg)
                } else {
                    resolve(true);
                }
            });
        });
    }

    /* Set Humidity */
    public setHumidity(humidity: number): Promise<string | boolean> {
        return new Promise((resolve, reject) => {
            if (humidity > 80 || humidity < 30) reject("Humidity value must be set between 30 and 80");
            let body = {
                ...Helper.bypassBodyV2(this.api),
                cid: this.cid,
                configModule: this.configModule,
                payload: Helper.createPayload(this, 'setTargetHumidity', {target_humidity: humidity}),
            }
            let result = Helper.callApi(this.api,
                ApiCalls.BYPASS_V2,
                'post', body, Helper.bypassHeader());
            result.then(result => {
                if (result.msg !== 'request success') {
                    console.log(result)
                    reject(result.msg)
                } else {
                    resolve(true);
                }
            });
        });
    }

    /* Getting Device Status */
    public getStatus(): Promise<any> {
        return new Promise((resolve, reject) => {
            let body = {
                ...Helper.bypassBodyV2(this.api),
                cid: this.cid,
                configModule: this.configModule,
                payload: Helper.createPayload(this, 'getHumidifierStatus', {}),
            }
            let result = Helper.callApi(this.api, ApiCalls.BYPASS_V2, 'post', body, Helper.bypassHeader());
            result.then(result => {
                try {
                    this.enabled = result.result.result.enabled;
                    this.humidity = result.result.result.filter_life;
                    this.mist_virtual_level = result.result.result.mode;
                    this.mist_level = result.result.result.level;
                    this.mode = result.result.result.mode;
                    this.water_lacks = result.result.result.water_lacks;
                    this.humidity_high = result.result.result.humidity_high;
                    this.water_tank_lifted = result.result.result.water_tank_lifted;
                    this.automatic_stop_reach_target = result.result.result.automatic_stop_reach_target;
                    this.night_light_brightness = result.result.result.night_light_brightness;
                    this.warm_mist_level = result.result.result.warm_mist_level;
                    this.warm_mist_enabled = result.result.result.warm_mist_enabled;
                    this.display = result.result.result.display ?? result.result.result.indicator_light_switch;
                    resolve(true)
                } catch (e: any) {
                    reject(result);
                }
            });
        });
    }

    /* Toggle display on/off. */
    public setDisplay(state: boolean): Promise<boolean | string> {
        return new Promise((resolve, reject) => {
            let payload = this.deviceType === 'Classic200S' ?
                Helper.createPayload(this, 'setIndicatorLightSwitch', {state: state})
                :
                Helper.createPayload(this, 'setDisplay', {enabled: state, id: 0})

            let body = {
                ...Helper.bypassBodyV2(this.api),
                cid: this.cid,
                configModule: this.configModule,
                payload: payload,
            }
            let result = Helper.callApi(this.api, ApiCalls.BYPASS_V2, 'post', body, Helper.bypassHeader());
            result.then(result => {
                if (result.msg !== 'request success') {
                    console.log(result)
                    reject(result.msg)
                } else {
                    this.display = state;
                    resolve(state);
                }
            });
        });
    }

    /* enableAutomaticStop */
    public enableAutomaticStop(mode: boolean): Promise<boolean | string> {
        return new Promise((resolve, reject) => {
            let body = {
                ...Helper.bypassBodyV2(this.api),
                cid: this.cid,
                configModule: this.configModule,
                payload: Helper.createPayload(this, 'setAutomaticStop', {enabled: mode}),
            }
            let result = Helper.callApi(this.api, ApiCalls.BYPASS_V2, 'post', body, Helper.bypassHeader());
            result.then(result => {
                if (result.msg !== 'request success') {
                    console.log(result)
                    reject(result.msg)
                } else {
                    this.automatic_stop_reach_target = mode;
                    resolve(mode);
                }
            });
        });
    }

    /* Set mode to manual or sleep or auto */
    public async setWarmLevel(level: number): Promise<string | number> {
        return new Promise((resolve, reject) => {
            if (!this.Device_Features[this.deviceType].features.includes('warm_mist') ?? false) reject(this.deviceType + ' don\'t support warm_mist');
            if (!this.Device_Features[this.deviceType].warm_mist_levels.includes(level) ?? false) reject(this.deviceType + ' don\'t support warm_mist_levels ' + level);
            let body = {
                ...Helper.bypassBodyV2(this.api),
                cid: this.cid,
                configModule: this.configModule,
                payload: Helper.createPayload(this, 'setLevel', {
                    id: 0,
                    level: level,
                    type: 'warm'
                }),
            }
            let result = Helper.callApi(this.api,
                ApiCalls.BYPASS_V2,
                'post', body, Helper.bypassHeader());
            result.then(result => {
                if (result.msg !== 'request success') {
                    console.log(result)
                    reject(result.msg)
                } else {
                    this.warm_mist_level = level;
                    this.warm_mist_enabled = true;
                    resolve(level);
                }
            });
        });
    }

    /* Set auto mode for humidifiers. */
    public async setAutoMode() {
        let mode = "";
        if (this.Device_Features[this.deviceType].mist_modes.includes('auto'))
            mode = 'auto';
        else if (this.Device_Features[this.deviceType].mist_modes.includes('humidity'))
            mode = 'humidity';
        else
            throw Error(this.deviceType + ' don\'t support mist_modes auto|humidity');
        await this.setHumidityMode(mode)
    }

    /* Set humidifier mist level with int between 0 - 9. */
    public async setMistLevel(level: number): Promise<string | number> {
        return new Promise((resolve, reject) => {
            if (!this.Device_Features[this.deviceType].mist_level.includes(level) ?? false) reject(this.deviceType + ' don\'t support mist level ' + level);
             let body = {
                ...Helper.bypassBodyV2(this.api),
                cid: this.cid,
                configModule: this.configModule,
                payload: Helper.createPayload(this, 'setVirtualLevel', {
                    id: 0,
                    level: level,
                    type: 'mist'
                }),
            }
            let result = Helper.callApi(this.api,
                ApiCalls.BYPASS_V2,
                'post', body, Helper.bypassHeader());
            result.then(result => {
                if (result.msg !== 'request success') {
                    console.log(result)
                    reject(result.msg)
                } else {
                    this.mist_level = level;
                    resolve(level);
                }
            });
        });
    }
}
