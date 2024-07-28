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
    autoPreference: string[]
    scheduleCount: number
    timerRemain: number
    efficientModeTimeRemain: number
    sleepPreference: string[]
    errorCode: number
}
