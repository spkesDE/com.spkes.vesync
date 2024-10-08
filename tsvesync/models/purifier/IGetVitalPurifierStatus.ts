export interface IGetVitalPurifierStatus {
    powerSwitch: number
    filterLifePercent: number
    workMode: string
    manualSpeedLevel: number
    fanSpeedLevel: number
    AQLevel: number
    PM25: number
    screenState: number
    childLockSwitch: number
    screenSwitch: number
    lightDetectionSwitch: number
    environmentLightState: number
    autoPreference: AutoPreference
    scheduleCount: number
    timerRemain: number
    efficientModeTimeRemain: number
    sleepPreference: SleepPreference
}

export interface AutoPreference {
    autoPreferenceType: string
    roomSize: number
}

export interface SleepPreference {
    sleepPreferenceType: string
    cleaningBeforeBedSwitch: number
    cleaningBeforeBedSpeedLevel: number
    cleaningBeforeBedMinutes: number
    whiteNoiseSleepAidSwitch: number
    whiteNoiseSleepAidSpeedLevel: number
    whiteNoiseSleepAidMinutes: number
    duringSleepSpeedLevel: number
    duringSleepMinutes: number
    afterWakeUpPowerSwitch: number
    afterWakeUpWorkMode: string
    afterWakeUpFanSpeedLevel: number
}
