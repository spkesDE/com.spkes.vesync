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
        return await this.post('setOscillationStatus', {
            horizontalOscillationState: Number(payload),
            actType: 'default'
        });
    }

    private normalizePedestalFanStatus(rawStatus: any): IGetTowerFanStatus {
        const oscillationState = rawStatus.horizontalOscillationState ?? rawStatus.verticalOscillationState ?? 0;
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
            temperature: this.pedestalNumberValue(rawStatus.temperature),
            errorCode: this.pedestalNumberValue(rawStatus.errorCode),
            sleepPreference: {
                sleepPreferenceType: rawStatus.sleepPreference?.sleepPreferenceType ?? "default",
                oscillationSwitch: this.pedestalNumberValue(rawStatus.sleepPreference?.oscillationState, oscillationState),
                initFanSpeedLevel: this.pedestalNumberValue(rawStatus.sleepPreference?.initFanSpeedLevel),
                fallAsleepRemain: this.pedestalNumberValue(rawStatus.sleepPreference?.fallAsleepRemain),
                autoChangeFanLevelSwitch: 0,
            },
            scheduleCount: this.pedestalNumberValue(rawStatus.scheduleCount),
            displayingType: this.pedestalNumberValue(rawStatus.displayingType),
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
