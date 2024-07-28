import exp from "node:constants";

export default interface IGetPurifierStatus {
    air_quality: number
    air_quality_value: number
    buzzer: boolean
    child_lock: boolean
    configuration: IPurifierConfiguration
    device_error_code: number
    display: boolean
    enabled: boolean
    extension: IExtensions
    filter_life: number
    level: number
    mode: string
    night_light: string
    plasma: boolean
    replace_filter: boolean
}

export interface IPurifierConfiguration {
    auto_preference: string
    display: boolean
    display_forever: boolean
    display_usable: boolean
    light_detection: boolean
}

export interface IExtensions {
    eco_mode_run_time: number
    efficient_mode_time_remain: number
    schedule_count: number
    timer_remain: number
}