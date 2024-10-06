import DeviceModes from "../../enum/DeviceModes";

/*
                              powerSwitch: 1, +
                              humidity: 54, +
                              targetHumidity: 60, +
                              virtualLevel: 5, +
                              mistLevel: 2, +
                              workMode: 'auto', +
                              waterLacksState: 0, +
                              waterTankLifted: 0,+
                              autoStopSwitch: 1, +
                              autoStopState: 0, +
                              screenSwitch: 0, +
                              screenState: 0,
                              scheduleCount: 0,
                              timerRemain: 0,
                              errorCode: 0,
                              nightLight: { nightLightSwitch: 0, brightness: 60 } +
 */

export default interface IGetOasis1000SStatus {
    powerSwitch: number
    humidity: number
    targetHumidity: number
    virtualLevel: number
    mistLevel: number
    workMode: string | DeviceModes
    waterLacksState: number
    waterTankLifted: number
    autoStopSwitch: number
    autoStopState: number
    screenSwitch: number
    screenState: number
    scheduleCount: number
    timerRemain: number
    errorCode: number
    nightLight: {
        nightLightSwitch: boolean
        brightness: number
    }
}