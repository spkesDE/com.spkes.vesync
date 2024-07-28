export interface IGetTowerFanStatus {
    powerSwitch: number;
    workMode: string;
    manualSpeedLevel: number;
    fanSpeedLevel: number;
    screenState: number;
    screenSwitch: number;
    oscillationSwitch: number;
    oscillationState: number;
    muteSwitch: number;
    muteState: number;
    timerRemain: number;
    temperature: number;
    errorCode: number;
    sleepPreference: {
        sleepPreferenceType: string;
        oscillationSwitch: number;
        initFanSpeedLevel: number;
        fallAsleepRemain: number;
        autoChangeFanLevelSwitch: number;
    };
    scheduleCount: number;
    displayingType: number;
}