import DeviceModes from "../../enum/DeviceModes";

import BasicPurifier from "../../lib/BasicPurifier";
import IApiResponse from "../../models/IApiResponse";
import ApiHelper from "../../lib/ApiHelper";
import {BodyTypes} from "../../enum/BodyTypes";
import {IGetLV131PurifierStatus} from "../../models/purifier/IGetLV131PurifierStatus";


export default class LV131S extends BasicPurifier {
    static deviceModels = ['LV-PUR131S', 'LV-RH131S'];
    static methods = ['getPurifierStatus', 'setSwitch', 'setNightLight', 'setLevel', 'setPurifierMode', 'setDisplay', 'setChildLock', 'setIndicatorLight'];
    static modes = [DeviceModes.Auto, DeviceModes.Manual, DeviceModes.Sleep];
    static levels = [1, 2, 3];
    static features = ['air_quality']


    public async setLevel(payload: number): Promise<IApiResponse<any>> {
        //Validate the level
        if (!LV131S.levels.includes(payload)) {
            throw new Error(`Invalid level: ${payload}`);
        }
        let body: any = {
            ...ApiHelper.requestBody(this.api, BodyTypes.DEVICE_STATUS),
            uuid: this.device.uuid,
            level: payload
        }
        return ApiHelper.callApi(this.api, "/131airPurifier/v1/device/updateSpeed", 'put', body)
    }

    public async setPurifierMode(mode: DeviceModes): Promise<IApiResponse<any>> {
        //Validate the mode
        if (!LV131S.modes.includes(mode)) {
            throw new Error(`Invalid mode: ${mode}`);
        }
        let body: any = {
            ...ApiHelper.requestBody(this.api, BodyTypes.DEVICE_STATUS),
            uuid: this.device.uuid,
            mode: mode
        }
        return ApiHelper.callApi(this.api, "/131airPurifier/v1/device/updateMode", 'put', body)
    }

    public async getPurifierStatus(): Promise<IApiResponse<any>> {
        let body: any = {
            ...ApiHelper.requestBody(this.api, BodyTypes.DEVICE_STATUS),
            uuid: this.device.uuid
        }
        const status: IApiResponse<IGetLV131PurifierStatus> = await ApiHelper.callApi<IGetLV131PurifierStatus>(this.api, "/131airPurifier/v1/device/deviceDetail", 'post', body)
        if (status.msg !== 'request success') return status;
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
        // Convert the status to the correct format
        this.status = {
            air_quality: status.result.result.airQuality, // Convert air quality string to numeric value
            air_quality_value: this.mapAirQuality(status.result.result.airQuality), // Map air quality to a numerical value
            buzzer: false, // Assuming buzzer functionality is not supported in LV131
            child_lock: status.result.result.childLock === 'on', // Set true if the child lock is on
            configuration: {
                auto_preference: "auto", // Default value or retrieve from status if applicable
                display: true, // Set based on display status if applicable
                display_forever: false, // Default value
                display_usable: true, // Default value
                light_detection: false // Default value
            },
            device_error_code: 0, // Default value for device error code
            display: status.result.result.screenStatus === 'on', // Device display status
            enabled: status.result.result.deviceStatus === 'on', // Determine if the device is enabled based on deviceStatus
            extension: {
                eco_mode_run_time: 0, // Default or determine if applicable
                efficient_mode_time_remain: 0, // Default or determine if applicable
                schedule_count: status.result.result.scheduleCount, // Schedule count from the API response
                timer_remain: status.result.result.timer ? status.result.result.timer.remainingTime || 0 : 0 // Fallback to 0 if timer is null
            },
            filter_life: status.result.result.filterLife.percent, // Filter life percentage from the API response
            level: status.result.result.level ?? status.result.result.levelNew ?? 0, // New level from the API response, defaulting to 0 if null
            mode: status.result.result.mode, // Direct mapping for mode
            night_light: "off", // Default value or retrieve if applicable
            plasma: false, // Default value or retrieve if applicable
            replace_filter: status.result.result.filterLife.change // Determine if the filter needs replacing
        };

        return {
            ...status,
            result: {
                traceId: status.result.traceId,
                code: status.result.code,
                result: this.status
            }
        }
    }

    private mapAirQuality(quality: string): number {
        switch (quality) {
            case 'excellent':
                return 0; // PM2.5: 0 µg/m³
            case 'good':
                return 12; // PM2.5: <= 12 µg/m³
            case 'moderate':
                return 35; // PM2.5: <= 35 µg/m³
            case 'poor':
                return 55; // PM2.5: <= 55 µg/m³
            case 'very poor':
                return 150; // PM2.5: > 55 µg/m³
            default:
                return 0; // Fallback value
        }
    }


    public async setSwitch(payload: boolean): Promise<IApiResponse<any>> {
        let body: any = {
            ...ApiHelper.requestBody(this.api, BodyTypes.DEVICE_STATUS),
            uuid: this.device.uuid,
            status: payload ? "on" : "off"
        }
        return ApiHelper.callApi(this.api, "/131airPurifier/v1/device/deviceStatus", 'put', body)
    }

    public async setDisplay(payload: boolean): Promise<IApiResponse<any>> {
        let body: any = {
            ...ApiHelper.requestBody(this.api, BodyTypes.DEVICE_STATUS),
            uuid: this.device.uuid,
            status: payload ? "on" : "off"
        }
        return ApiHelper.callApi(this.api, "/131airPurifier/v1/device/updateScreen", 'put', body)
    }


}