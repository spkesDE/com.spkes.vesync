import IApiResponse from "../models/IApiResponse";
import IGetPurifierStatus from "../models/purifier/IGetPurifierStatus";
import BasicDevice from "./BasicDevice";
import DeviceModes from "../enum/DeviceModes";

export default class BasicPurifier extends BasicDevice {
    static levels: number[] = [];

    static hasLevel(level: number): boolean {
        return this.levels.includes(level);
    }

    status: IGetPurifierStatus | null = null;

    // Methods shared across all purifiers, leave some abstract if specific devices need custom implementations
    public async getPurifierStatus(): Promise<IApiResponse<IGetPurifierStatus>> {
        const status = await this.post<any>('getPurifierStatus', {});
        if (!status) throw new Error('Failed to get humidifier status');
        if (status.msg === 'request success') {
            this.status = this.normalizePurifierStatus(status.result?.result ?? {});
            return {
                ...status,
                result: {
                    ...status.result,
                    result: this.status
                }
            };
        }
        return status;
    }

    public async setSwitch(payload: boolean): Promise<IApiResponse<any>> {
        return await this.post('setSwitch', {
            enabled: payload,
            id: 0
        });
    }

    public async setLevel(payload: number): Promise<IApiResponse<any>> {
        return await this.post('setLevel', {
            level: payload,
            id: 0,
            type: 'wind'
        });
    }

    public async setPurifierMode(payload: DeviceModes): Promise<IApiResponse<any>> {
        return await this.post('setPurifierMode', {
            mode: payload
        });
    }

    public async setDisplay(payload: boolean): Promise<IApiResponse<any>> {
        return await this.post('setDisplay', {
            state: payload
        });
    }

    public async setChildLock(payload: boolean): Promise<IApiResponse<any>> {
        return await this.post('setChildLock', {
            child_lock: payload
        });
    }

    // 'setNightLight', {night_light: mode.toLowerCase()}
    public async setNightLight(payload: string): Promise<IApiResponse<any>> {
        // Allowed on, off, dim
        if (!['on', 'off', 'dim'].includes(payload.toLowerCase())) return Promise.reject('Invalid night light mode');
        return await this.post('setNightLight', {
            night_light: payload.toLowerCase()
        });
    }

    protected normalizePurifierStatus(rawStatus: any): IGetPurifierStatus {
        const filterLife = this.numberValue(rawStatus.filter_life, rawStatus.filterLifePercent, 100);
        const airQualityValue = this.numberValue(rawStatus.air_quality_value, rawStatus.PM25);

        return {
            ...rawStatus,
            air_quality: rawStatus.air_quality ?? this.mapPMValueToQuality(airQualityValue),
            air_quality_value: airQualityValue,
            buzzer: this.booleanValue(rawStatus.buzzer),
            child_lock: this.booleanValue(rawStatus.child_lock, rawStatus.childLockSwitch),
            configuration: rawStatus.configuration,
            device_error_code: this.numberValue(rawStatus.device_error_code, rawStatus.errorCode),
            display: this.booleanValue(rawStatus.display, rawStatus.screenSwitch),
            enabled: this.booleanValue(rawStatus.enabled, rawStatus.powerSwitch, rawStatus.deviceStatus),
            extension: rawStatus.extension,
            filter_life: filterLife,
            level: this.numberValue(rawStatus.level, rawStatus.fanSpeedLevel, rawStatus.manualSpeedLevel),
            mode: rawStatus.mode ?? rawStatus.workMode ?? DeviceModes.Off,
            night_light: rawStatus.night_light ?? "off",
            plasma: this.booleanValue(rawStatus.plasma),
            replace_filter: rawStatus.replace_filter ?? filterLife <= 10,
            filterOpenStatus: rawStatus.filterOpenStatus ?? rawStatus.filterOpenState === 1,
            AQLevel: rawStatus.AQLevel,
            AQPercent: rawStatus.AQPercent,
            PM25: rawStatus.PM25,
            PM1: rawStatus.PM1,
            PM10: rawStatus.PM10,
            fanRotateAngle: rawStatus.fanRotateAngle,
        };
    }

    private mapPMValueToQuality(pmValue: number): string {
        if (pmValue === 0) return 'excellent';
        if (pmValue <= 12) return 'good';
        if (pmValue <= 35) return 'moderate';
        if (pmValue <= 55) return 'poor';
        return 'very poor';
    }

}
