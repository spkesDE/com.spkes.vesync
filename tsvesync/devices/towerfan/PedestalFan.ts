import DeviceModes from "../../enum/DeviceModes";
import BasicTowerFan from "../../lib/BasicTowerFan";
import IApiResponse from "../../models/IApiResponse";
import {IGetTowerFanStatus} from "../../models/towerfan/IGetTowerFanStatus";

export default class PedestalFan extends BasicTowerFan {
    static deviceModels = ['LPF-R432S-AEU', 'LPF-R432S-AUS'];
    static methods = ['getFanStatus', 'setDisplay', 'setLevel', 'setMuteSwitch', 'setOscillationStatus', 'setSwitch', 'setFanMode'];
    static levels = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
    static modes = [DeviceModes.AdvancedSleep, DeviceModes.Eco, DeviceModes.Turbo, DeviceModes.Normal];

    public async getTowerFanStatus(): Promise<IApiResponse<IGetTowerFanStatus>> {
        const status = await this.post<any>('getFanStatus', {});
        if (!status) throw new Error('Failed to get fan status');
        if (status.msg !== 'request success') return status;

        this.status = this.normalizePedestalFanStatus(status.result?.result ?? {});
        return {
            ...status,
            result: {
                ...status.result,
                result: this.status
            }
        };
    }

    public async setTowerFanMode(payload: DeviceModes): Promise<IApiResponse<any>> {
        return await this.post('setFanMode', {
            workMode: payload
        });
    }

    public async setOscillationSwitch(payload: boolean): Promise<IApiResponse<any>> {
        return await this.setOscillationState({horizontal: payload});
    }

    public async setVerticalOscillationSwitch(payload: boolean): Promise<IApiResponse<any>> {
        return await this.setOscillationState({vertical: payload});
    }

    public async setHorizontalOscillationRange(left: number, right: number): Promise<IApiResponse<any>> {
        return await this.setOscillationState({horizontal: true, left, right});
    }

    public async setVerticalOscillationRange(top: number, bottom: number): Promise<IApiResponse<any>> {
        return await this.setOscillationState({vertical: true, top, bottom});
    }

    private async setOscillationState(payload: {
        horizontal?: boolean,
        vertical?: boolean,
        left?: number,
        right?: number,
        top?: number,
        bottom?: number,
    }): Promise<IApiResponse<any>> {
        if (payload.vertical !== undefined) {
            return await this.post('setOscillationStatus', {
                verticalOscillationState: Number(payload.vertical),
                actType: 'default',
                ...(payload.vertical && payload.top !== undefined && payload.bottom !== undefined ? {
                    top: payload.top,
                    bottom: payload.bottom,
                } : {}),
            });
        }

        return await this.post('setOscillationStatus', {
            horizontalOscillationState: Number(payload.horizontal),
            actType: 'default',
            ...(payload.horizontal && payload.left !== undefined && payload.right !== undefined ? {
                left: payload.left,
                right: payload.right,
            } : {}),
        });
    }

    private normalizePedestalFanStatus(rawStatus: any): IGetTowerFanStatus {
        const oscillationState = rawStatus.horizontalOscillationState ?? rawStatus.verticalOscillationState ?? 0;
        const temperature = this.pedestalNumberValue(rawStatus.temperature);
        const highTemperature = this.pedestalNumberValue(rawStatus.highTemperature);
        const oscillationRange = rawStatus.oscillationRange
            ? {
                left: this.pedestalNumberValue(rawStatus.oscillationRange.left),
                right: this.pedestalNumberValue(rawStatus.oscillationRange.right),
                top: this.pedestalNumberValue(rawStatus.oscillationRange.top),
                bottom: this.pedestalNumberValue(rawStatus.oscillationRange.bottom),
            }
            : undefined;

        return {
            ...rawStatus,
            powerSwitch: this.pedestalNumberValue(rawStatus.powerSwitch),
            workMode: rawStatus.workMode ?? DeviceModes.Normal,
            manualSpeedLevel: this.pedestalNumberValue(rawStatus.manualSpeedLevel, rawStatus.fanSpeedLevel),
            fanSpeedLevel: this.pedestalNumberValue(rawStatus.fanSpeedLevel, rawStatus.manualSpeedLevel),
            screenState: this.pedestalNumberValue(rawStatus.screenState, rawStatus.screenSwitch),
            screenSwitch: this.pedestalNumberValue(rawStatus.screenSwitch, rawStatus.screenState),
            oscillationSwitch: this.pedestalNumberValue(oscillationState),
            oscillationState: this.pedestalNumberValue(oscillationState),
            muteSwitch: this.pedestalNumberValue(rawStatus.muteSwitch, rawStatus.muteState),
            muteState: this.pedestalNumberValue(rawStatus.muteState, rawStatus.muteSwitch),
            timerRemain: this.pedestalNumberValue(rawStatus.timerRemain),
            temperature: temperature ? this.convertTemperature(temperature) : 0,
            errorCode: this.pedestalNumberValue(rawStatus.errorCode),
            sleepPreference: {
                sleepPreferenceType: rawStatus.sleepPreference?.sleepPreferenceType ?? "default",
                oscillationSwitch: this.pedestalNumberValue(rawStatus.sleepPreference?.oscillationState, oscillationState),
                oscillationState: this.pedestalNumberValue(rawStatus.sleepPreference?.oscillationState, oscillationState),
                initFanSpeedLevel: this.pedestalNumberValue(rawStatus.sleepPreference?.initFanSpeedLevel),
                fallAsleepRemain: this.pedestalNumberValue(rawStatus.sleepPreference?.fallAsleepRemain),
                autoChangeFanLevelSwitch: 0,
            },
            scheduleCount: this.pedestalNumberValue(rawStatus.scheduleCount),
            displayingType: this.pedestalNumberValue(rawStatus.displayingType),
            horizontalOscillationState: this.pedestalNumberValue(rawStatus.horizontalOscillationState),
            verticalOscillationState: this.pedestalNumberValue(rawStatus.verticalOscillationState),
            childLock: this.pedestalNumberValue(rawStatus.childLock),
            highTemperatureReminderState: this.pedestalNumberValue(rawStatus.highTemperatureReminderState),
            highTemperature: highTemperature ? this.convertTemperature(highTemperature) : 0,
            smartCleaningReminderState: this.pedestalNumberValue(rawStatus.smartCleaningReminderState),
            oscillationCalibrationState: this.pedestalNumberValue(rawStatus.oscillationCalibrationState),
            oscillationCalibrationProgress: this.pedestalNumberValue(rawStatus.oscillationCalibrationProgress),
            oscillationCoordinate: {
                yaw: this.pedestalNumberValue(rawStatus.oscillationCoordinate?.yaw),
                pitch: this.pedestalNumberValue(rawStatus.oscillationCoordinate?.pitch),
            },
            oscillationRange,
            levelMemory: Array.isArray(rawStatus.levelMemory)
                ? rawStatus.levelMemory.map((memory: any) => ({
                    workMode: memory.workMode ?? DeviceModes.Normal,
                    level: this.pedestalNumberValue(memory.level),
                    enable: this.pedestalNumberValue(memory.enable),
                }))
                : [],
            horizontalOscillationDemo: this.pedestalNumberValue(rawStatus.horizontalOscillationDemo),
            verticalOscillationDemo: this.pedestalNumberValue(rawStatus.verticalOscillationDemo),
            isSupportSetOnceOscillation: this.pedestalNumberValue(rawStatus.isSupportSetOnceOscillation),
            isTimerSupportPowerOn: this.pedestalNumberValue(rawStatus.isTimerSupportPowerOn),
            isSupportSetRelativeCoordinate: this.pedestalNumberValue(rawStatus.isSupportSetRelativeCoordinate),
        };
    }

    private pedestalNumberValue(...values: any[]): number {
        for (const value of values) {
            if (typeof value === 'number' && !Number.isNaN(value)) return value;
            if (typeof value === 'string' && value.trim() !== '') {
                const parsed = Number(value);
                if (!Number.isNaN(parsed)) return parsed;
            }
        }
        return 0;
    }
}
