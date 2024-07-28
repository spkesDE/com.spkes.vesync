export interface IGetLV131PurifierStatus {
    code: number
    msg: string
    traceId: string
    screenStatus: string
    filterLife: {
        change: boolean
        useHour: number
        percent: number
    }
    activeTime: number
    timer: any
    scheduleCount: number
    schedule: any
    levelNew: number
    airQuality: string
    level: any
    mode: string
    deviceName: string
    currentFirmVersion: string
    childLock: string
    deviceStatus: string
    deviceImg: string
    connectionStatus: string
}