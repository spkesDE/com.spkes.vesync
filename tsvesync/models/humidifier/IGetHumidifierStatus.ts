import DeviceModes from "../../enum/DeviceModes";

export default interface IGetHumidifierStatus {
    humidity: number
    enabled: boolean
    mode: string | DeviceModes
    mist_level: number
    virtual_mist_level: number
    warm_mist_enabled: boolean
    warm_mist_level: number
    water_lacks: boolean
    humidity_high: boolean
    water_tank_lifted: boolean
    automatic_stop_reach_target: boolean
    night_light_brightness: number
    autoStopSwitch: boolean
    indicator_light_switch: boolean
    configuration: IPurifierConfiguration
}

export interface IPurifierConfiguration {
    auto_target_humidity: number
}
