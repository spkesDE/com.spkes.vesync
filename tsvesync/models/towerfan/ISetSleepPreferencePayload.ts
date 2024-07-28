export interface ISetSleepPreferencePayload {
    sleepPreferenceType: string;
    oscillationSwitch: boolean | 0 | 1;
    initFanSpeedLevel: number
    fallAsleepRemain: boolean | 0 | 1;
    autoChangeFanLevelSwitch: boolean | 0 | 1;
}