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
    horizontalOscillationState?: number;
    verticalOscillationState?: number;
    childLock?: number;
    highTemperatureReminderState?: number;
    highTemperature?: number;
    smartCleaningReminderState?: number;
    oscillationCalibrationState?: number;
    oscillationCalibrationProgress?: number;
    oscillationCoordinate?: {
        yaw: number;
        pitch: number;
    };
    oscillationRange?: {
        left: number;
        right: number;
        top: number;
        bottom: number;
    };
    levelMemory?: Array<{
        workMode: string;
        level: number;
        enable: number;
    }>;
    horizontalOscillationDemo?: number;
    verticalOscillationDemo?: number;
    isSupportSetOnceOscillation?: number;
    isTimerSupportPowerOn?: number;
    isSupportSetRelativeCoordinate?: number;
}
