import BasicHumidifier from "../../lib/BasicHumidifier";
import DeviceModes from "../../enum/DeviceModes";
import IGetOasis1000SStatus from "../../models/humidifier/IGetOasis1000SStatus";
import IApiResponse from "../../models/IApiResponse";

export default class Oasis1000S extends BasicHumidifier {
    static deviceModels = ['LUH-M101S-WUS', 'LUH-M101S-WEUR'];
    static methods = ['getHumidifierStatus', 'setAutoStopSwitch', 'setSwitch', 'setVirtualLevel', 'setTargetHumidity', 'setHumidityMode', 'setDisplay', 'setNightLightBrightness'];
    static features = [];
    static levels = [1, 2, 3, 4, 5, 6, 7, 8, 9];
    static modes = [DeviceModes.Auto, DeviceModes.Sleep, DeviceModes.Manual];

    public async getHumidifierStatus(): Promise<IApiResponse<any>> {
        const status = await this.post<IGetOasis1000SStatus>('getHumidifierStatus', {});
        if (status.msg === 'request success') {
            // Convert the status to the IGetHumidifierStatus format
            this.status = {
                humidity: status.result?.result.humidity, // Direct mapping
                enabled: status.result.result.powerSwitch === 1, // Convert to boolean
                mode: status.result.result.workMode, // Mode mapping
                mist_level: status.result.result.mistLevel, // Mist level mapping
                virtual_mist_level: status.result.result.virtualLevel, // Virtual level mapping
                warm_mist_enabled: false, // Assuming warm mist is not available; set accordingly
                warm_mist_level: 0, // Set to 0 or retrieve if applicable
                water_lacks: status.result.result.waterLacksState === 1, // Convert to boolean
                humidity_high: false, // Implement logic to determine if humidity is high, if needed
                water_tank_lifted: status.result.result.waterTankLifted === 1, // Convert to boolean
                automatic_stop_reach_target: status.result.result.autoStopState === 1, // Convert to boolean
                night_light_brightness: status.result.result.nightLight.brightness, // Night light brightness mapping
                autoStopSwitch: status.result.result.autoStopSwitch === 1, // Convert to boolean
                indicator_light_switch: status.result.result.screenSwitch === 1, // Convert to boolean
                configuration: {
                    auto_target_humidity: status.result.result.targetHumidity // Configuration for auto target humidity
                }
            };
            return {
                ...status,
                result: {
                    traceId: status.result.traceId,
                    code: status.result.code,
                    result: this.status
                }
            }
        } else {
            return status;
        }
    }

    public async setDisplay(payload: boolean): Promise<IApiResponse<any>> {
        return await this.post('setDisplay', {
            screenSwitch: Number(payload)
        });
    }

    public async setHumidityMode(payload: string): Promise<IApiResponse<any>> {
        return await this.post('setHumidityMode', {
            workMode: payload.toLowerCase()
        });
    }

    public async setMistLevel(payload: number): Promise<IApiResponse<any>> {
        if (!this.hasLevel(payload)) return Promise.reject('Invalid mist level');
        return await this.post('setVirtualLevel', {
            levelIdx: 0,
            virtualLevel: payload,
            levelType: 'mist'
        });
    }

    public async setSwitch(payload: boolean): Promise<IApiResponse<any>> {
        return await this.post('setSwitch', {
            powerSwitch: Number(payload),
            switchIdx: 0
        });
    }

    public async setTargetHumidity(payload: number): Promise<IApiResponse<any>> {
        if (payload < 0 || payload > 100) return Promise.reject(new Error('Humidity must be between 0 and 100'));
        return await this.post('setTargetHumidity', {
            targetHumidity: payload
        });
    }

    public async setAutoStopSwitch(payload: boolean): Promise<IApiResponse<any>> {
        return await this.post('setAutoStopSwitch', {
            autoStopSwitch: Number(payload)
        });
    }

    public async setNightLightBrightness(payload: number): Promise<IApiResponse<any>> {
        if (payload < 0 || payload > 100) return Promise.reject(new Error('Brightness must be between 0 and 100'));
        return await this.post('setNightLightBrightness', {
            nightLightBrightness: payload
        });
    }


}